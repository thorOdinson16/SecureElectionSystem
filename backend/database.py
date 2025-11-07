import mysql.connector
from mysql.connector import pooling
from contextlib import contextmanager
import os
from dotenv import load_dotenv
load_dotenv()

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": os.getenv("DB_PASSWORD"),
    "database": "SecureElectionDB",
    "pool_name": "election_pool",
    "pool_size": 5
}

connection_pool = pooling.MySQLConnectionPool(**DB_CONFIG)

@contextmanager
def get_db_connection():
    conn = connection_pool.get_connection()
    try:
        yield conn
    finally:
        conn.close()

@contextmanager
def get_db_cursor(dictionary=True):
    with get_db_connection() as conn:
        cursor = conn.cursor(dictionary=dictionary)
        try:
            yield cursor, conn
        finally:
            cursor.close()

def execute_query(query, params=None, fetch=False, fetch_one=False):
    with get_db_cursor() as (cursor, conn):
        cursor.execute(query, params or ())
        if fetch_one:
            return cursor.fetchone()
        if fetch:
            return cursor.fetchall()
        conn.commit()
        return cursor.lastrowid

def call_procedure(proc_name, params):
    with get_db_cursor() as (cursor, conn):
        cursor.callproc(proc_name, params)
        conn.commit()
        results = []
        for result in cursor.stored_results():
            results.append(result.fetchall())
        return results