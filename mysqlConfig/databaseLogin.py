# -*- coding: utf-8 -*-
"""
Created on Mon Apr 20 15:39:45 2020

@author: Spencer
"""
# Module For Connecting To MySQL database 
import mysql.connector
  
# Function for connecting to MySQL database 
def mysqlconnect(): 
    #Trying to connect  
    try: 
        mydb=mysql.connector.connect(user='root',password='cherrydragonfruit',
                        host='localhost',database='rage',use_pure=True)
    # If connection is not successful 
    except: 
        print("Can't connect to database") 
        return 0
    # If Connection Is Successful 
    return mydb
