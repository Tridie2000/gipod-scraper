import axios from 'axios'
import dayjs from 'dayjs'
import lodash from 'lodash'
import { Sequelize, DataTypes } from 'sequelize';

const geoApi = 'https://geo.api.vlaanderen.be/GIPOD/ogc/features/v1/collections/HINDER'

const sequelize = new Sequelize({ dialect: "sqlite", storage: 'gipod.sqlite', logging: false });

const Closure = sequelize.define("Closure", {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    start: {
        type: DataTypes.DATE,
    },
    end: {
        type: DataTypes.DATE,
    },
    lastUpdate: {
        type: DataTypes.DATE,
    },
    description: {
        type: DataTypes.STRING,
    },
    hindrance: {
        type: DataTypes.STRING,
    },
    geometry: {
        type: DataTypes.STRING,
    }
}, {
    name: "closure",
    freezeTableName: true
})

await sequelize.sync()

function getDateRanges() {
    const dateRanges = [];
    const tomorrow = dayjs().add(1, 'day').startOf('day');

    for (let i = 0; i < 5; i++) {
        const start = tomorrow.add(i, 'day').startOf('day').toISOString();
        const end = tomorrow.add(i, 'day').endOf('day').toISOString();
        dateRanges.push(`${start}/${end}`);
    }

    return dateRanges;
}

const dateRanges = getDateRanges();

const features = []

for (const dateRange of dateRanges) {
    const response = await axios.get(`${geoApi}/items?limit=10000&datetime=${encodeURIComponent(dateRange)}&filter-lang=cql-text`)
    features.push(...response.data.features)
}

const uniqueFeatures = lodash.uniqBy(features, 'id')
console.log(uniqueFeatures.length)

const validatedFeatures = uniqueFeatures.filter((feature) => feature.properties.HindranceStatus === 'Gevalideerd')
console.log(validatedFeatures.length)

const severeFeatures = validatedFeatures.filter((feature) => feature.properties.SevereHindrance)
console.log(severeFeatures.length)

const featureIds = severeFeatures.map((feature) => feature.id)

// Check if features were deleted
const result = await Closure.findAll({
    attributes: ['id']
})
for (const closure of result) {
    if (!featureIds.includes(closure.id)) {
        console.log('Closure deleted:', closure.id)
        await Closure.destroy({ where: { id: closure.id } })
    }
}

for (const feature of severeFeatures) {
    // Check if we already know about this feature
    const result = await Closure.findByPk(feature.id)
    if (result) {
        // Check if there is an update
        const dateInDatabase = dayjs(result.lastUpdate).toISOString()
        const dateOfFeature = dayjs(feature.properties.HindranceLastModifiedOn).toISOString()
        if (dateInDatabase !== dateOfFeature) {
            console.log('Update on existing closure:', feature.id)
            await result.update({
                start: feature.properties.HindranceStart,
                end: feature.properties.HindranceEnd,
                description: feature.properties.HindranceDescription,
                lastUpdate: feature.properties.HindranceLastModifiedOn,
                hindrance: feature.properties.Consequences,
                geometry: JSON.stringify(feature.geometry.coordinates),
            })
            await result.save()
        } else {
            console.log('No changes detected for feature:', feature.id)
        }
    } else {
        console.log('New closure:', feature.id)
        await Closure.create({
            id: feature.id,
            start: feature.properties.HindranceStart,
            end: feature.properties.HindranceEnd,
            description: feature.properties.HindranceDescription,
            lastUpdate: feature.properties.HindranceLastModifiedOn,
            hindrance: feature.properties.Consequences,
            geometry: JSON.stringify(feature.geometry.coordinates),
        })
    }
}
