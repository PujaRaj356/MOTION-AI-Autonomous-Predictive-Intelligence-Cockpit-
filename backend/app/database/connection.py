import os
import json
from datetime import datetime
import pymongo
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "predictive_maintenance"

class DatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.is_connected = False
        self.fallback_file = "data/db_fallback.json"
        self._init_fallback_store()
        self._connect_mongodb()

    def _init_fallback_store(self):
        os.makedirs("data", exist_ok=True)
        if not os.path.exists(self.fallback_file):
            initial_data = {
                "machines": self._default_machines(),
                "predictions": [],
                "scenarios": [],
                "sensor_readings": [],
                "maintenance_records": self._default_maintenance()
            }
            with open(self.fallback_file, "w") as f:
                json.dump(initial_data, f, indent=2)

    def _default_machines(self):
        return [
            {
                "machine_id": "M-101",
                "name": "CNC Milling Machine 01",
                "machine_type": "CNC Lathe (H)",
                "status": "HEALTHY",
                "health_score": 91,
                "failure_probability": 0.082,
                "rul": 184,
                "air_temperature": 24.5,
                "process_temperature": 34.8,
                "rpm": 1540,
                "torque": 42.1,
                "tool_wear": 45,
                "last_updated": datetime.now().isoformat()
            },
            {
                "machine_id": "M-102",
                "name": "CNC Milling Machine 02",
                "machine_type": "CNC Lathe (L)",
                "status": "CRITICAL",
                "health_score": 34,
                "failure_probability": 0.824,
                "rul": 47,
                "air_temperature": 31.2,
                "process_temperature": 42.5,
                "rpm": 2450,
                "torque": 68.4,
                "tool_wear": 215,
                "last_updated": datetime.now().isoformat()
            },
            {
                "machine_id": "M-103",
                "name": "Heavy Duty Router",
                "machine_type": "Router (M)",
                "status": "WARNING",
                "health_score": 61,
                "failure_probability": 0.471,
                "rul": 92,
                "air_temperature": 28.4,
                "process_temperature": 38.1,
                "rpm": 1820,
                "torque": 52.0,
                "tool_wear": 142,
                "last_updated": datetime.now().isoformat()
            },
            {
                "machine_id": "M-104",
                "name": "Precision Spindle 04",
                "machine_type": "Spindle (H)",
                "status": "HEALTHY",
                "health_score": 88,
                "failure_probability": 0.114,
                "rul": 165,
                "air_temperature": 23.8,
                "process_temperature": 33.9,
                "rpm": 1490,
                "torque": 39.5,
                "tool_wear": 60,
                "last_updated": datetime.now().isoformat()
            },
            {
                "machine_id": "M-105",
                "name": "High Speed Drill 05",
                "machine_type": "Drill (L)",
                "status": "WARNING",
                "health_score": 58,
                "failure_probability": 0.512,
                "rul": 84,
                "air_temperature": 29.8,
                "process_temperature": 40.2,
                "rpm": 2100,
                "torque": 58.6,
                "tool_wear": 178,
                "last_updated": datetime.now().isoformat()
            }
        ]

    def _default_maintenance(self):
        return [
            {
                "id": "WO-901",
                "machine_id": "M-102",
                "title": "Critical Spindle Thermal Overhaul",
                "issue": "High process temperature (42.5°C) and excessive tool wear (215 min)",
                "recommended_action": "Replace tungsten carbide cutting tip and flush heat exchanger fluid.",
                "priority": "HIGH",
                "status": "OPEN",
                "created_at": datetime.now().isoformat()
            },
            {
                "id": "WO-902",
                "machine_id": "M-103",
                "title": "Preventive Rotor Inspection",
                "issue": "Vibration and elevated torque (52.0 Nm)",
                "recommended_action": "Inspect drive belt tension and re-grease rotor bearings.",
                "priority": "MEDIUM",
                "status": "OPEN",
                "created_at": datetime.now().isoformat()
            }
        ]

    def _connect_mongodb(self):
        try:
            self.client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=1000)
            self.client.admin.command('ping')
            self.db = self.client[DB_NAME]
            self.is_connected = True
            print("Successfully connected to MongoDB!")
            # Ensure collections exist
            if "machines" not in self.db.list_collection_names():
                self.db.machines.insert_many(self._default_machines())
            if "maintenance_records" not in self.db.list_collection_names():
                self.db.maintenance_records.insert_many(self._default_maintenance())
        except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
            self.is_connected = False
            print(f"MongoDB connection offline ({e}). Using FileStore fallback.")

    def get_collection_data(self, collection_name: str):
        if self.is_connected:
            try:
                records = list(self.db[collection_name].find({}, {"_id": 0}))
                return records
            except Exception:
                pass
        
        # Fallback file store
        with open(self.fallback_file, "r") as f:
            data = json.load(f)
            return data.get(collection_name, [])

    def save_record(self, collection_name: str, record: dict):
        if self.is_connected:
            try:
                rec_copy = record.copy()
                self.db[collection_name].insert_one(rec_copy)
            except Exception as e:
                print("Error saving to MongoDB:", e)
                
        # Always update local JSON store as well for sync reliability
        with open(self.fallback_file, "r") as f:
            data = json.load(f)
            
        if collection_name not in data:
            data[collection_name] = []
        data[collection_name].append(record)
        
        with open(self.fallback_file, "w") as f:
            json.dump(data, f, indent=2)

    def update_machine_state(self, machine_id: str, updates: dict):
        if self.is_connected:
            try:
                self.db.machines.update_one({"machine_id": machine_id}, {"$set": updates})
            except Exception:
                pass
                
        with open(self.fallback_file, "r") as f:
            data = json.load(f)
            
        machines = data.get("machines", [])
        for m in machines:
            if m["machine_id"] == machine_id:
                m.update(updates)
                break
        else:
            # Add if not found
            new_m = {"machine_id": machine_id}
            new_m.update(updates)
            machines.append(new_m)
            
        data["machines"] = machines
        with open(self.fallback_file, "w") as f:
            json.dump(data, f, indent=2)

db_manager = DatabaseManager()
