-- BigQuery Table Schema for DalScooter Analytics
-- Run these commands in BigQuery Console or using bq CLI

-- Create dataset if not exists
CREATE SCHEMA IF NOT EXISTS `dalscooter-analytics-467621.dalscooter_data_warehouse`
OPTIONS (
  description = "Data warehouse for DalScooter analytics and visualization"
);

-- Bikes table
CREATE OR REPLACE TABLE `dalscooter-analytics-467621.dalscooter_data_warehouse.bikes` (
  bikeId STRING NOT NULL,
  createdAt TIMESTAMP,
  description STRING,
  details STRING,
  lastUpdateDate TIMESTAMP,
  location STRING,
  model STRING,
  ratePerHour INT64,
  status STRING
);

-- Users table
CREATE OR REPLACE TABLE `dalscooter-analytics-467621.dalscooter_data_warehouse.users` (
  createdAt BOOL,
  questions STRING,
  userId STRING NOT NULL,
  userType STRING,
  username STRING
);

-- Bookings table
CREATE OR REPLACE TABLE `dalscooter-analytics-467621.dalscooter_data_warehouse.bookings` (
  accessCode INT64,
  approvedAt TIMESTAMP,
  bikeId STRING,
  bikeType STRING,
  bookingReferenceCode STRING,
  createdAt TIMESTAMP,
  endTime TIMESTAMP,
  ratePerHour INT64,
  startTime TIMESTAMP,
  status STRING,
  userId STRING
);

-- Feedback table
CREATE OR REPLACE TABLE `dalscooter-analytics-467621.dalscooter_data_warehouse.feedback` (
  bikeId STRING,
  comment STRING,
  feedbackId STRING NOT NULL,
  rating INT64,
  sentiment STRING,
  timestamp TIMESTAMP,
  userId STRING
);
