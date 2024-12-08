import express from 'express';
import { Sequelize, DataTypes } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

const app = express();
const PORT = 9300;

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'gipod.sqlite',
});

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
    },
    handled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
}, {
    freezeTableName: true,
    timestamps: false,
});

app.use(express.json());
app.use(express.static('web'));


app.get('/api/mapbox-token', (_, res) => {
    const mapboxToken = process.env.MAPBOX_TOKEN;
    if (!mapboxToken) {
        return res.status(500).json({ error: 'Mapbox token not found in environment variables.' });
    }
    res.json({ token: mapboxToken });
});

app.get('/api/closures', async (_, res) => {
    try {
        const closures = await Closure.findAll();
        res.json(closures);
    } catch (error) {
        console.error('Error fetching closures:', error);
        res.status(500).json({ error: 'Unable to fetch closures.' });
    }
});

app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        await sequelize.sync();
    } catch (error) {
        console.error('Database connection failed:', error);
    }
});
