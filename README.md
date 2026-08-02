# 💰 DMoney API Testing Assignment

<p align="center">

![Postman](https://img.shields.io/badge/Postman-API%20Testing-orange?logo=postman)
![Newman](https://img.shields.io/badge/Newman-Report-success)
![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)
![Status](https://img.shields.io/badge/Assertions-76%20Passed-brightgreen)
![GitHub](https://img.shields.io/badge/GitHub-Assignment-blue?logo=github)

</p>

---

# 📑 Table of Contents

- Project Overview
- Testing Workflow
- Project Structure
- Technologies Used
- Test Cases
- Newman Report
- API Documentation
- How to Run
- Git Ignore
- Author

---

# 📌 Project Overview

This repository contains the API Testing assignment for the DMoney Transaction System.

The project was completed using **Postman**, **Newman**, and **GitHub**.

The assignment includes:

- API Collection
- Positive Test Cases
- Negative Test Cases
- Assertions
- Newman HTML Report
- Test Case Document
- README Documentation

---

# 🔄 Testing Workflow

The following business flow was tested successfully:

1. Admin Login
2. System Login
3. Create Customer 1
4. Create Customer 2
5. Create Agent
6. Create Merchant
7. Activate Customer 1
8. Activate Customer 2
9. Activate Agent
10. Activate Merchant
11. Agent Login + OTP Verification
12. Customer 1 Login + OTP Verification
13. Customer 2 Login + OTP Verification
14. System Deposit → Agent (5000 BDT)
15. Agent Deposit → Customer (2000 BDT)
16. Customer 1 Send Money → Customer 2 (1000 BDT)
17. Customer 2 Cash Out → Agent (500 BDT)
18. Customer 2 Payment → Merchant (400 BDT)

---

# 📁 Project Structure

```text
Assignment-2
│
├── DMoney API Testing.postman_collection.json
├── Batch19.postman_environment.json
├── DMoney_API_Test_Cases.xlsx
├── README.md
├── .gitignore
│
├── Reports
│   └── newman-report.html
│
└── Screenshot
    └── newman-report.png
```

---

# 🛠 Technologies Used

- Postman
- Newman
- HTML Extra Reporter
- Node.js
- Git
- GitHub

---

# ✅ Test Cases

| Type | Count |
|------|------:|
| Positive Test Cases | 18 |
| Negative Test Cases | 12 |
| Total | **30** |

All test cases contain proper assertions.

## 📑 Test Cases

The complete test cases are available here:

- Excel File: `Dmoney_API_Test_Cases.xlsx`
- Google Sheets: https://docs.google.com/spreadsheets/d/1AnLLKh9ILtRol8m1Rp6B6rN4Lxss5i7v-DGK0wGdlK0/edit?gid=0#gid=0

---

## Newman Report

| Item | Result |
|------|-------:|
| Requests | 21 |
| Assertions | 76 |
| Failed | 0 |

### Newman Report Screenshot

![Newman Report](Screenshot/newman_report.png)

---

## API Documentation

Published Postman Documentation:

https://documenter.getpostman.com/view/53084089/2sBY4TqJJs

> The exported Postman Collection is included in this repository.

---

# 🚀 How to Run

## Install Newman

```bash
npm install -g newman
```

## Install HTML Extra Reporter

```bash
npm install -g newman-reporter-htmlextra
```

## Execute Collection

```bash
newman run Batch19_API_Testing.postman_collection.json ^
-e Batch19.postman_environment.json ^
--folder "01 - Assignment Flow" ^
-r cli,htmlextra ^
--reporter-htmlextra-export Reports/newman-report.html
```

---

# 📂 Repository Files

- Postman Collection
- Postman Environment
- Test Case Excel
- Newman Report
- README
- Screenshots

---

# 🚫 .gitignore

```text
node_modules/
Reports/
.env
```

---

# 👨‍💻 Author

**Abdullah Al Mahmud Joy**

Full Stack SDET - ROAD to SDET
M.Sc. in Computer Science & Engineering
Military Institute of Science and Technology (MIST)
B.Sc. in Computer Science & Engineering
Bangladesh University of Business and Technology (BUBT)

---

# ⭐ Assignment Status

- ✅ Postman Collection Completed
- ✅ Positive Test Cases
- ✅ Negative Test Cases
- ✅ Assertions Added
- ✅ Newman Execution Passed
- ✅ README Prepared
- ✅ Ready for GitHub Submission
