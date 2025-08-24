# Federal Cost Analyzer Pro

## Important Notice
**This is NOT an official U.S. Government application.** This is a sample accounting application for demonstration purposes only.

## Purpose
Federal Cost Analyzer Pro is a comprehensive cost analysis platform designed to help government agencies, contractors, and event planners calculate accurate costs for federal personnel, equipment, supplies, and travel expenses. The application uses official data from the Office of Personnel Management (OPM) and General Services Administration (GSA) to provide reliable cost calculations for budgeting, event planning, and chargeback purposes.

## Features

### Core Functionality
- **Personnel Cost Calculator**: Calculate GS grade salaries with locality pay, special rates, and hourly/daily rates
- **Event Cost Calculator**: Comprehensive event planning with multiple personnel roles, equipment, and supplies
- **Equipment & Supplies Management**: Extensive catalog of government equipment and supplies with pricing
- **Travel Cost Calculator**: GSA per diem rates, airfare (City Pair Program), POV mileage, and transportation services
- **Contractor & Overtime Costs**: Support for contractor services and overtime calculations
- **Custom Cost Management**: One-time and recurring cost tracking
- **Chargeback System**: Detailed cost allocation and billing for events and services
- **Invoice Generation**: Export to Excel and PDF formats with multiple templates

### Data Sources
- **OPM.gov**: Official GS salary tables, locality pay, and special rates
- **GSA.gov**: Per diem rates, airfare contracts, transportation services, and travel policies
- **Real-time Calculations**: Dynamic cost calculations based on location, grade, and requirements

### Professional Features
- **Government-themed UI**: Professional appearance suitable for government use
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Export Capabilities**: Excel and PDF export for reports and invoices
- **Comprehensive Reporting**: Detailed breakdowns and chargeback reports
- **Security Considerations**: Built-in disclaimers and security notices

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Setup
```bash
# Clone the repository
git clone github.com/tomblanchard312/federal-cost-analyzer-pro
cd federal-cost-analyzer-pro

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start the application
npm start
```

### Environment Variables
Create a `.env` file with the following variables:
```env
PORT=3001
NODE_ENV=development
OPM_BASE_URL=https://www.opm.gov
GSA_BASE_URL=https://www.gsa.gov
```

## Usage

### Individual Personnel Calculator
1. Navigate to the main page
2. Select GS Grade (1-15)
3. Choose Step (1-10)
4. Select Locality/State
5. Enter Annual Hours (default: 2087)
6. Click "Calculate" to get detailed pricing

### Event Cost Calculator
1. Navigate to Event Cost Calculator
2. Fill in Basic Information (event details, location, dates)
3. Add Personnel Requirements (roles, grades, hours)
4. Configure Equipment & Supplies
5. Add Custom Costs
6. Calculate Travel Expenses
7. Generate comprehensive cost breakdown
8. Create invoices and chargeback reports

### Export Options
- **Excel Export**: Detailed cost breakdowns in spreadsheet format
- **PDF Export**: Professional invoice templates
- **CSV Export**: Chargeback reports for accounting systems

## API Endpoints

### Personnel & Pricing
- `GET /api/gs-grades` - Available GS grades
- `GET /api/locality-rates` - Locality pay rates
- `GET /api/special-rates` - Special rate tables
- `POST /api/calculate` - Calculate personnel costs

### Event Management
- `POST /api/calculate-event` - Calculate total event costs
- `POST /api/generate-invoice` - Create invoice
- `POST /api/generate-chargeback` - Generate chargeback report

### Travel & Transportation
- `GET /api/gsa-per-diem-rates` - Per diem rates by location
- `GET /api/gsa-airfare-rates` - City pair airfare rates
- `GET /api/gsa-pov-mileage-rates` - POV mileage rates
- `POST /api/calculate-travel-costs` - Calculate travel expenses

### Equipment & Supplies
- `GET /api/equipment-catalog` - Equipment categories and pricing
- `GET /api/supplies-catalog` - Supplies categories and pricing

### Export & Reporting
- `POST /api/export-invoice-excel` - Export invoice to Excel
- `POST /api/export-invoice-pdf` - Export invoice to PDF

## Security & Usage Disclaimer

### Important Security Information
- **This is a SAMPLE application** and is NOT in an IL6 (Impact Level 6) environment
- **DO NOT enter classified information, PII, or sensitive government data**
- **This application is for demonstration and training purposes only**
- **If you need to use this application with real data, deploy it in the appropriate secure environment**

### Data Privacy
- All calculations are performed locally
- No data is stored or transmitted to external servers
- Uses only publicly available government data sources
- No authentication or user accounts required

### Government Compliance
- Uses official OPM and GSA data sources
- Follows government design standards
- Includes appropriate disclaimers and notices
- Suitable for government training and demonstration

## Contributing

### Development Guidelines
- Follow government web application standards
- Ensure accessibility compliance (508 standards)
- Test all calculations thoroughly
- Update documentation for new features
- Maintain security best practices

### Testing
```bash
# Run tests
npm test

# Test specific endpoints
curl -X POST http://localhost:3001/api/calculate \
  -H "Content-Type: application/json" \
  -d '{"grade": "13", "step": "5", "locality": "DC", "hours": 2087}'
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **OPM.gov**: Official government personnel data and salary tables
- **GSA.gov**: Government travel policies, per diem rates, and transportation services
- **Federal Government**: Design standards and accessibility requirements

## Support

For questions or issues:
1. Check the documentation and API endpoints
2. Review the security disclaimers
3. Ensure you're using the application in an appropriate environment
4. Contact the development team for technical support

---

**Remember**: This is a sample application for demonstration purposes. Always use official government systems for production work.
