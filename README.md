# 🛴 DalScooter - Smart Serverless Bike Sharing Platform

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![AWS](https://img.shields.io/badge/Amazon_AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=for-the-badge&logo=terraform&logoColor=white)
![Lambda](https://img.shields.io/badge/AWS_Lambda-FF9900?style=for-the-badge&logo=aws-lambda&logoColor=white)

_A modern, cloud-native bike sharing solution built with React & AWS serverless architecture_

</div>

## 🌟 Overview

DalScooter is a comprehensive serverless bike sharing platform that revolutionizes urban mobility through intelligent booking systems, real-time availability tracking, and advanced security features. Built entirely on AWS serverless architecture, it offers scalable, cost-effective solutions for modern transportation needs.

## ✨ Key Features

### 🔐 **Advanced Security & Authentication**

- Multi-factor authentication with custom Caesar cipher challenges
- AWS Cognito integration with custom auth flows
- Secure user verification and session management

### 📱 **Smart Booking System**

- Real-time bike availability tracking
- Intelligent reservation algorithms
- Automated booking completion and bike status updates
- QR code-based bike access system

### 🤖 **AI-Powered Experience**

- Integrated chatbot using Amazon Lex
- Natural language processing for user queries
- Automated customer support and assistance

### 📊 **Comprehensive Analytics**

- Real-time admin dashboard with key metrics
- Automated data export to S3 and BigQuery
- Sentiment analysis for user feedback
- Advanced reporting and insights

### 🌐 **Modern Frontend**

- Responsive React application with Vite
- Tailwind CSS for modern UI/UX
- Real-time updates and notifications
- Cross-platform compatibility

## 🏗️ Architecture

### **Frontend (React + Vite)**

```
├── Authentication & User Management
├── Bike Browsing & Booking Interface
├── Admin Dashboard & Analytics
├── Real-time Chat Integration
└── Responsive Mobile-First Design
```

### **Backend (AWS Serverless)**

```
├── AWS Lambda Functions (25+ microservices)
├── Amazon DynamoDB (NoSQL Database)
├── Amazon Cognito (Authentication)
├── Amazon API Gateway (REST APIs)
├── Amazon S3 (File Storage)
├── Amazon EventBridge (Event Processing)
├── Amazon SNS/SQS (Messaging)
└── Amazon Lex (Chatbot Intelligence)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- AWS CLI configured
- Terraform installed

### Frontend Setup

```bash
cd dalscooter-frontend
npm install
npm run dev
```

### Infrastructure Deployment

```bash
cd dalscooter-infrastructure
terraform init
terraform plan
terraform apply
```

## 📁 Project Structure

```
DalScooter/
├── dalscooter-frontend/         
│   ├── src/
│   │   ├── components/              
│   │   ├── pages/              
│   │   ├── services/              
│   │   └── context/               
│   └── public/                    
├── dalscooter-infrastructure/    
│   ├── lambda_functions/          
│   │   ├── authentication/          
│   │   ├── bikes/                 
│   │   ├── bookings/            
│   │   ├── admin/                   
│   │   └── feedback/                
│   └── modules/                    
└── test/                         
```

## 🛠️ Technology Stack

| Category           | Technology                            |
| ------------------ | ------------------------------------- |
| **Frontend**       | React, Vite, Tailwind CSS, JavaScript |
| **Backend**        | AWS Lambda, Python                    |
| **Database**       | Amazon DynamoDB                       |
| **Authentication** | Amazon Cognito                        |
| **Infrastructure** | Terraform, AWS CloudFormation         |
| **APIs**           | Amazon API Gateway                    |
| **Storage**        | Amazon S3                             |
| **Messaging**      | Amazon SNS, SQS                       |
| **Analytics**      | Google BigQuery                       |
| **AI/ML**          | Amazon Lex, Sentiment Analysis        |

## 🌟 Core Functionalities

### For Users

- **Secure Registration** with multi-factor authentication
- **Browse Available Bikes** with real-time status
- **Smart Booking System** with instant confirmations
- **QR Code Access** for seamless bike unlocking
- **Booking Management** with history and modifications
- **Feedback System** with sentiment analysis
- **AI Chatbot Support** for instant assistance

### For Admins

- **Comprehensive Dashboard** with real-time metrics
- **Bike Fleet Management** with status tracking
- **User Management** and authentication oversight
- **Booking Analytics** and revenue insights
- **Automated Reporting** to S3 and BigQuery
- **Concern Management** system

## 🔧 Advanced Features

- **Serverless Architecture**: 100% serverless for optimal scalability
- **Real-time Processing**: Event-driven architecture with EventBridge
- **Data Analytics**: Automated insights and reporting
- **Multi-environment Support**: Dev, staging, and production ready
- **CI/CD Ready**: Infrastructure as Code with Terraform
- **Security First**: AWS best practices implementation

## 📊 Performance Metrics

- ⚡ **Sub-second response times** for API calls
- 🔄 **99.9% uptime** with serverless architecture
- 📈 **Auto-scaling** based on demand
- 💰 **Cost-optimized** pay-per-use model

## 🤝 Contributors

| Student ID | Name                    |
| ---------- | ----------------------- |
| B01024200  | Mihir Dilipbhai Patel   |
| B00988337  | Het Ghanshyambhai Patel |
| B01012281  | Sakthi Sharan Mahadevan |
| B00987734  | Sivarajesh Balamurali   |

## 📄 License

This project is part of CSCI 5410 - Serverless Computing coursework at Dalhousie University.

---

<div align="center">

**⭐ Star this repository if you found it helpful! ⭐**

_Built with ❤️ by Team 2 - Dalhousie University_

</div>
