const ExcelJS = require('exceljs');
const fs = require('fs');

async function createTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Saveetha Medical College Hospital - Department of Urology';
  workbook.lastModifiedBy = 'StentSync Registry System';
  workbook.created = new Date();

  // Sheet 1: Backlog Data Entry
  const sheet = workbook.addWorksheet('Stent Backlog Data', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  // Define Columns
  sheet.columns = [
    { header: 'UHID', key: 'uhid', width: 18 },
    { header: 'Patient Name', key: 'name', width: 24 },
    { header: 'Phone', key: 'phone', width: 16 },
    { header: 'Laterality', key: 'laterality', width: 16 },
    { header: 'Material', key: 'material', width: 22 },
    { header: 'Unit', key: 'unit', width: 14 },
    { header: 'Second Language', key: 'second_language', width: 18 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Insertion Date', key: 'insertion_date', width: 16 },
    { header: 'Planned Removal Date', key: 'planned_removal_date', width: 22 },
    { header: 'Actual Removal Date', key: 'actual_removal_date', width: 22 },
    { header: 'Residual Stone', key: 'residual_stone', width: 16 },
    { header: 'Surgeon', key: 'surgeon', width: 28 },
    { header: 'Notes / Procedure', key: 'notes', width: 34 },
  ];

  // Header Style
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FF334155' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };
  });

  // Sample Rows
  const sampleData = [
    {
      uhid: '260826056037',
      name: 'Kumar K',
      phone: '9840123456',
      laterality: 'Right',
      material: 'Carbothane',
      unit: 'Unit 1',
      second_language: 'Tamil',
      status: 'Active',
      insertion_date: '2026-08-20',
      planned_removal_date: '',
      actual_removal_date: '',
      residual_stone: 'No',
      surgeon: 'Prof. N. Muthulatha',
      notes: 'Right URSL + Stenting for upper ureteric calculus'
    },
    {
      uhid: '260826055322',
      name: 'Anitha S',
      phone: '9566144061',
      laterality: 'Left',
      material: 'Carbothane',
      unit: 'Unit 1',
      second_language: 'Tamil',
      status: 'Active',
      insertion_date: '2026-08-15',
      planned_removal_date: '',
      actual_removal_date: '',
      residual_stone: 'No',
      surgeon: 'Prof. N. Muthulatha',
      notes: 'Left Mini-PCNL with DJ stenting'
    },
    {
      uhid: '260826054110',
      name: 'Rajesh Verma',
      phone: '9876543210',
      laterality: 'Bilateral',
      material: 'Carbothane',
      unit: 'Unit 2',
      second_language: 'Hindi',
      status: 'Active',
      insertion_date: '2026-08-10',
      planned_removal_date: '',
      actual_removal_date: '',
      residual_stone: 'Yes',
      surgeon: 'Prof. M. Siva Sankar',
      notes: 'Bilateral RIRS for multiple renal calculi'
    },
    {
      uhid: '260826053221',
      name: 'Govindaraj M',
      phone: '9444112233',
      laterality: 'Right',
      material: 'Regular',
      unit: 'Unit 1',
      second_language: 'Tamil',
      status: 'Removed',
      insertion_date: '2025-11-10',
      planned_removal_date: '2026-02-10',
      actual_removal_date: '2026-02-08',
      residual_stone: 'No',
      surgeon: 'Prof. N. Muthulatha',
      notes: 'Historical case - Successfully removed in OPD'
    },
    {
      uhid: '260826052199',
      name: 'Priya Dharshini',
      phone: '9888776655',
      laterality: 'Left',
      material: 'Silicone',
      unit: 'Unit 2',
      second_language: 'Tamil',
      status: 'Active',
      insertion_date: '2026-06-01',
      planned_removal_date: '',
      actual_removal_date: '',
      residual_stone: 'No',
      surgeon: 'Prof. M. Siva Sankar',
      notes: 'Long term silicone stent for benign ureteric stricture'
    }
  ];

  sampleData.forEach((row) => sheet.addRow(row));

  // Apply row styling and formatting
  for (let r = 2; r <= 3000; r++) {
    const row = sheet.getRow(r);
    row.height = 20;

    // Apply Data Validation (Dropdowns)
    // Laterality (Column D)
    sheet.getCell('D' + r).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Right,Left,Bilateral"'],
      showErrorMessage: true,
      errorTitle: 'Invalid Laterality',
      error: 'Please choose Right, Left, or Bilateral'
    };

    // Material (Column E)
    sheet.getCell('E' + r).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Carbothane,Regular,Silicone"'],
      showErrorMessage: true,
      errorTitle: 'Invalid Material',
      error: 'Please select a valid stent material from the dropdown'
    };

    // Unit (Column F)
    sheet.getCell('F' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Unit 1,Unit 2"'],
      showErrorMessage: true,
      errorTitle: 'Invalid Unit',
      error: 'Please choose Unit 1 or Unit 2'
    };

    // Second Language (Column G)
    sheet.getCell('G' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Tamil,Hindi"'],
      showErrorMessage: true,
      errorTitle: 'Invalid Language',
      error: 'Please choose Tamil or Hindi'
    };

    // Status (Column H)
    sheet.getCell('H' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Active,Removed"'],
      showErrorMessage: true,
      errorTitle: 'Invalid Status',
      error: 'Please select Active or Removed'
    };

    // Residual Stone (Column L)
    sheet.getCell('L' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"No,Yes"'],
      showErrorMessage: true,
      errorTitle: 'Invalid Value',
      error: 'Please choose No or Yes'
    };

    // Surgeon (Column M)
    sheet.getCell('M' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Prof. N. Muthulatha,Prof. M. Siva Sankar,Prof. M. Griffin,Dr. C. Dev Krishna Barathi,Dr. Mohammed Farooq,Dr. Arvind Ramachandran,Dr. Kuppan C T"'],
      showErrorMessage: false
    };

    // Alignment
    ['A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].forEach((col) => {
      sheet.getCell(col + r).alignment = { vertical: 'middle', horizontal: 'center' };
    });
    sheet.getCell('B' + r).alignment = { vertical: 'middle', horizontal: 'left' };
    sheet.getCell('N' + r).alignment = { vertical: 'middle', horizontal: 'left' };
  }

  // Sheet 2: Guidelines & Reference
  const refSheet = workbook.addWorksheet('Instructions & Guidelines');
  refSheet.columns = [
    { header: 'Parameter', key: 'param', width: 28 },
    { header: 'Details & Clinical Safety Rules', key: 'desc', width: 70 },
  ];

  const refHeader = refSheet.getRow(1);
  refHeader.height = 26;
  refHeader.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  const guidelines = [
    { param: 'UHID (Required)', desc: 'Unique Hospital ID (e.g., 260826056037 or SMCH-2026-00902).' },
    { param: 'Patient Name (Required)', desc: 'Full Name of the patient.' },
    { param: 'Phone Number (Required)', desc: '10-digit mobile number for WhatsApp & SMS outreach.' },
    { param: 'Laterality (Dropdown)', desc: 'Select Right, Left, or Bilateral from dropdown. If Bilateral, the system automatically creates 2 independent tracking records for Left & Right.' },
    { param: 'Material (Dropdown)', desc: 'Carbothane (180 days lifespan), Regular (90 days), or Silicone (365 days).' },
    { param: 'Unit (Dropdown)', desc: 'Unit 1 (OP Days: Mon & Wed | Chief: Prof. N. Muthulatha) or Unit 2 (OP Days: Tue & Thu | Chief: Prof. M. Siva Sankar).' },
    { param: 'Status (Dropdown)', desc: 'Active (stent currently in-situ) or Removed (if patient already underwent stent removal in the past).' },
    { param: 'Insertion Date (Required)', desc: 'Format: YYYY-MM-DD (e.g., 2026-08-20) or DD/MM/YYYY (e.g., 20/08/2026).' },
    { param: 'Planned Removal Date', desc: 'Leave blank to auto-calculate automatically based on stent material lifespan.' },
    { param: 'Actual Removal Date', desc: 'Fill only if Status is Removed (e.g. 2026-02-08).' },
    { param: 'Residual Stone (Dropdown)', desc: 'Select Yes if residual stone fragments exist and need clearance.' },
    { param: 'Surgeon (Dropdown)', desc: 'Operating surgeon name from the departmental roster.' },
  ];

  guidelines.forEach((g) => refSheet.addRow(g));

  const outPath = 'public/saveetha_stent_backlog_master_template.xlsx';
  await workbook.xlsx.writeFile(outPath);
  console.log('Successfully generated master Excel template at ' + outPath);
}

createTemplate();
