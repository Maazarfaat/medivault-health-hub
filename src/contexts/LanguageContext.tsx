import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type Language = 'en' | 'hi' | 'ur' | 'te' | 'mr' | 'kn';

interface LanguageLabels {
  [key: string]: string;
}

const translations: Record<Language, LanguageLabels> = {
  en: {
    // Common
    dashboard: 'Dashboard',
    settings: 'Settings',
    logout: 'Log out',
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    loading: 'Loading...',
    search: 'Search',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    name: 'Name',
    email: 'Email',
    mobile: 'Mobile',
    language: 'Language',
    
    // Auth
    login: 'Log in',
    register: 'Get Started',
    signUp: 'Sign Up',
    
    // User Dashboard
    welcomeBack: 'Welcome back',
    medicineOverview: "Here's your medicine overview",
    totalMedicines: 'Total Medicines',
    expiringSoon: 'Expiring Soon',
    expired: 'Expired',
    lowStock: 'Low Stock',
    quickActions: 'Quick Actions',
    scanQR: 'Scan QR',
    manualEntry: 'Manual Entry',
    bookTest: 'Book Test',
    addMedicine: 'Add Medicine',
    myMedicines: 'My Medicines',
    myBloodTestBookings: 'My Blood Test Bookings',
    noBookingsYet: 'No blood test bookings yet.',
    noMedicinesYet: 'No medicines added yet. Add your first medicine to start tracking.',
    restockNow: 'Restock',
    outOfStock: 'Out of stock',
    confirmed: 'Your blood test appointment has been confirmed.',
    
    // Booking
    bookBloodTest: 'Book Blood Test',
    testType: 'Test Type',
    selectTestType: 'Select test type',
    preferredDate: 'Preferred Date',
    preferredTime: 'Preferred Time',
    additionalNotes: 'Additional Notes',
    bookingCreated: 'Blood Test Booking Created Successfully',
    bookingDesc: 'Your booking request has been sent to diagnostic centres.',
    bookAppointment: 'Book Appointment',
    booking: 'Booking...',
    
    // Medicine
    medicineName: 'Medicine Name',
    batchNumber: 'Batch Number',
    expiryDate: 'Expiry Date',
    quantity: 'Quantity',
    dosage: 'Dosage',
    prescribedDoses: 'Prescribed Doses',
    medicineAdded: 'Medicine Added',
    addMedicineTitle: 'Add Medicine',
    qrScan: 'QR Scan',
    manual: 'Manual',
    simulateQR: 'Simulate QR Scan',
    qrScanned: 'QR Scanned',
    qrDesc: 'Medicine details populated. Review and save.',
    cameraNotAvailable: 'Camera not available in this environment.',
    clickSimulate: 'Click below to simulate a scan.',
    
    // Adherence
    adherence: 'Adherence',
    takeDose: 'Take Dose',
    doseTaken: 'Dose Recorded',
    doseDesc: 'Your adherence has been updated.',
    adherenceScore: 'Adherence Score',
    
    // Pharmacy
    pharmacyDashboard: 'Pharmacy Dashboard',
    manageInventory: 'Manage your inventory and sales',
    totalItems: 'Total Items',
    inventoryValue: 'Inventory Value',
    sellMedicine: 'Sell Medicine',
    addInventory: 'Add Inventory',
    csvUpload: 'CSV Upload',
    restockRequests: 'Restock Requests',
    pendingRestocks: 'Pending Restock Requests',
    accept: 'Accept',
    reject: 'Reject',
    fulfill: 'Fulfill',
    inventory: 'Inventory',
    searchMedicines: 'Search medicines...',
    addItem: 'Add Item',
    noInventory: 'No inventory items. Add your first item to get started.',
    distance: 'Distance',
    requestAccepted: 'Request accepted',
    requestRejected: 'Request rejected',
    requestFulfilled: 'Request fulfilled',
    
    // Blood Test Centre
    diagnosticDashboard: 'Diagnostic Centre Dashboard',
    manageBookings: 'Manage blood test bookings',
    totalBookings: 'Total Bookings',
    pending: 'Pending',
    accepted: 'Accepted',
    completed: 'Completed',
    bookingRequests: 'Booking Requests',
    noBookings: 'No bookings yet.',
    complete: 'Complete',
    done: 'Done',
    bookingUpdated: 'Booking Updated',
    statusChanged: 'Status changed to',
    userName: 'User Name',
    testTypeCol: 'Test Type',
    requestedDate: 'Requested Date',
    time: 'Time',
    notes: 'Notes',
    
    // Hospital
    hospitalDashboard: 'Hospital Dashboard',
    manageInventoryAdherence: 'Manage inventory and patient adherence',
    addMedicineScan: 'Add Medicine (Scan/Manual)',
    medicineInventory: 'Medicine Inventory',
    noInventoryYet: 'No inventory items yet. Add your first medicine.',
    patientAdherence: 'Patient Adherence',
    
    // Location
    locationRequested: 'Location access requested',
    locationDenied: 'Location access denied. Request will be sent to all providers.',
    restockSent: 'Restock Request Sent',
    restockDesc: 'sent to nearby pharmacies.',
    requestFor: 'Request for',
    openMap: 'Open in Maps',
    noLocation: 'No location',
    location: 'Location',
    saveLocation: 'Save My Location',
    locationSaved: 'Location saved successfully',
    
    // Status
    safe: 'Safe',
    expiring: 'Expiring',
    
    // Features page (Index)
    heroTitle: 'Your Complete Medicine Tracking Platform',
    heroSubtitle: 'Track medications, manage inventory, book blood tests, and stay on top of your health with MediVault.',
    getStarted: 'Get Started',
    learnMore: 'Learn More',
    features: 'Features',
    about: 'About',
    contact: 'Contact',
  },
  hi: {
    dashboard: 'डैशबोर्ड', settings: 'सेटिंग्स', logout: 'लॉग आउट', save: 'सेव करें', cancel: 'रद्द करें', submit: 'जमा करें', loading: 'लोड हो रहा है...', search: 'खोजें', actions: 'कार्य', status: 'स्थिति', date: 'तारीख', name: 'नाम', email: 'ईमेल', mobile: 'मोबाइल', language: 'भाषा',
    login: 'लॉग इन', register: 'शुरू करें', signUp: 'साइन अप',
    welcomeBack: 'वापस स्वागत है', medicineOverview: 'आपकी दवाओं का अवलोकन', totalMedicines: 'कुल दवाएं', expiringSoon: 'जल्दी समाप्त', expired: 'समाप्त', lowStock: 'कम स्टॉक', quickActions: 'त्वरित कार्य', scanQR: 'QR स्कैन', manualEntry: 'मैन्युअल एंट्री', bookTest: 'टेस्ट बुक करें', addMedicine: 'दवा जोड़ें', myMedicines: 'मेरी दवाएं', myBloodTestBookings: 'मेरी रक्त परीक्षण बुकिंग', noBookingsYet: 'अभी तक कोई बुकिंग नहीं।', noMedicinesYet: 'अभी तक कोई दवा नहीं जोड़ी गई।', restockNow: 'रीस्टॉक', outOfStock: 'स्टॉक खत्म', confirmed: 'आपकी रक्त परीक्षण अपॉइंटमेंट की पुष्टि हो गई है।',
    bookBloodTest: 'रक्त परीक्षण बुक करें', testType: 'परीक्षण प्रकार', selectTestType: 'परीक्षण प्रकार चुनें', preferredDate: 'पसंदीदा तारीख', preferredTime: 'पसंदीदा समय', additionalNotes: 'अतिरिक्त नोट्स', bookingCreated: 'रक्त परीक्षण बुकिंग सफल', bookingDesc: 'आपका अनुरोध डायग्नोस्टिक सेंटरों को भेजा गया।', bookAppointment: 'अपॉइंटमेंट बुक करें', booking: 'बुक हो रहा है...',
    medicineName: 'दवा का नाम', batchNumber: 'बैच नंबर', expiryDate: 'समाप्ति तिथि', quantity: 'मात्रा', dosage: 'खुराक', prescribedDoses: 'निर्धारित खुराक', medicineAdded: 'दवा जोड़ी गई', addMedicineTitle: 'दवा जोड़ें', qrScan: 'QR स्कैन', manual: 'मैन्युअल', simulateQR: 'QR स्कैन सिमुलेट करें', qrScanned: 'QR स्कैन हुआ', qrDesc: 'दवा विवरण भरे गए। समीक्षा करें और सेव करें।', cameraNotAvailable: 'कैमरा उपलब्ध नहीं।', clickSimulate: 'सिमुलेट करने के लिए नीचे क्लिक करें।',
    adherence: 'पालन', takeDose: 'खुराक लें', doseTaken: 'खुराक दर्ज', doseDesc: 'आपका पालन अपडेट किया गया।', adherenceScore: 'पालन स्कोर',
    pharmacyDashboard: 'फार्मेसी डैशबोर्ड', manageInventory: 'अपनी इन्वेंट्री और बिक्री प्रबंधित करें', totalItems: 'कुल आइटम', inventoryValue: 'इन्वेंट्री मूल्य', sellMedicine: 'दवा बेचें', addInventory: 'इन्वेंट्री जोड़ें', csvUpload: 'CSV अपलोड', restockRequests: 'रीस्टॉक अनुरोध', pendingRestocks: 'लंबित रीस्टॉक अनुरोध', accept: 'स्वीकार', reject: 'अस्वीकार', fulfill: 'पूरा करें', inventory: 'इन्वेंट्री', searchMedicines: 'दवाएं खोजें...', addItem: 'आइटम जोड़ें', noInventory: 'कोई इन्वेंट्री नहीं।', distance: 'दूरी', requestAccepted: 'अनुरोध स्वीकृत', requestRejected: 'अनुरोध अस्वीकृत', requestFulfilled: 'अनुरोध पूरा',
    diagnosticDashboard: 'डायग्नोस्टिक सेंटर डैशबोर्ड', manageBookings: 'रक्त परीक्षण बुकिंग प्रबंधित करें', totalBookings: 'कुल बुकिंग', pending: 'लंबित', accepted: 'स्वीकृत', completed: 'पूर्ण', bookingRequests: 'बुकिंग अनुरोध', noBookings: 'अभी तक कोई बुकिंग नहीं।', complete: 'पूरा करें', done: 'हो गया', bookingUpdated: 'बुकिंग अपडेट', statusChanged: 'स्थिति बदली', userName: 'उपयोगकर्ता नाम', testTypeCol: 'परीक्षण प्रकार', requestedDate: 'अनुरोधित तारीख', time: 'समय', notes: 'नोट्स',
    hospitalDashboard: 'अस्पताल डैशबोर्ड', manageInventoryAdherence: 'इन्वेंट्री और मरीज पालन प्रबंधित करें', addMedicineScan: 'दवा जोड़ें (स्कैन/मैन्युअल)', medicineInventory: 'दवा इन्वेंट्री', noInventoryYet: 'अभी तक कोई इन्वेंट्री नहीं।', patientAdherence: 'मरीज पालन',
    locationRequested: 'स्थान अनुमति मांगी', locationDenied: 'स्थान अनुमति अस्वीकृत।', restockSent: 'रीस्टॉक अनुरोध भेजा', restockDesc: 'निकटतम फार्मेसियों को भेजा गया।', requestFor: 'अनुरोध',
    safe: 'सुरक्षित', expiring: 'समाप्त होने वाला',
    heroTitle: 'आपका संपूर्ण दवा ट्रैकिंग प्लेटफ़ॉर्म', heroSubtitle: 'MediVault के साथ दवाओं को ट्रैक करें, इन्वेंट्री प्रबंधित करें, रक्त परीक्षण बुक करें।', getStarted: 'शुरू करें', learnMore: 'और जानें', features: 'सुविधाएं', about: 'परिचय', contact: 'संपर्क',
  },
  ur: {
    dashboard: 'ڈیش بورڈ', settings: 'ترتیبات', logout: 'لاگ آؤٹ', save: 'محفوظ کریں', cancel: 'منسوخ', submit: 'جمع کریں', loading: 'لوڈ ہو رہا ہے...', search: 'تلاش', actions: 'اقدامات', status: 'حیثیت', date: 'تاریخ', name: 'نام', email: 'ای میل', mobile: 'موبائل', language: 'زبان',
    login: 'لاگ ان', register: 'شروع کریں', signUp: 'سائن اپ',
    welcomeBack: 'واپسی پر خوش آمدید', medicineOverview: 'آپ کی دوائیوں کا جائزہ', totalMedicines: 'کل دوائیں', expiringSoon: 'جلد ختم ہونے والی', expired: 'ختم شدہ', lowStock: 'کم اسٹاک', quickActions: 'فوری اقدامات', scanQR: 'QR اسکین', manualEntry: 'دستی اندراج', bookTest: 'ٹیسٹ بک کریں', addMedicine: 'دوائی شامل کریں', myMedicines: 'میری دوائیں', myBloodTestBookings: 'میرے خون کے ٹیسٹ بکنگ', noBookingsYet: 'ابھی تک کوئی بکنگ نہیں۔', noMedicinesYet: 'ابھی تک کوئی دوائی شامل نہیں۔', restockNow: 'ری اسٹاک', outOfStock: 'اسٹاک ختم', confirmed: 'آپ کی تقرری کی تصدیق ہو گئی۔',
    bookBloodTest: 'خون کا ٹیسٹ بک کریں', testType: 'ٹیسٹ کی قسم', selectTestType: 'قسم منتخب کریں', preferredDate: 'ترجیحی تاریخ', preferredTime: 'ترجیحی وقت', additionalNotes: 'اضافی نوٹس', bookingCreated: 'بکنگ کامیاب', bookingDesc: 'آپ کی درخواست بھیج دی گئی۔', bookAppointment: 'تقرری بک کریں', booking: 'بک ہو رہا ہے...',
    medicineName: 'دوائی کا نام', batchNumber: 'بیچ نمبر', expiryDate: 'میعاد', quantity: 'مقدار', dosage: 'خوراک', prescribedDoses: 'تجویز کردہ خوراک', medicineAdded: 'دوائی شامل ہوئی', addMedicineTitle: 'دوائی شامل کریں', qrScan: 'QR اسکین', manual: 'دستی', simulateQR: 'QR اسکین سمولیٹ', qrScanned: 'QR اسکین ہوا', qrDesc: 'تفصیلات بھری گئیں۔', cameraNotAvailable: 'کیمرہ دستیاب نہیں۔', clickSimulate: 'سمولیٹ کرنے کے لیے کلک کریں۔',
    adherence: 'پابندی', takeDose: 'خوراک لیں', doseTaken: 'خوراک ریکارڈ', doseDesc: 'آپ کی پابندی اپ ڈیٹ ہوئی۔', adherenceScore: 'پابندی سکور',
    pharmacyDashboard: 'فارمیسی ڈیش بورڈ', manageInventory: 'اپنی انوینٹری منظم کریں', totalItems: 'کل آئٹمز', inventoryValue: 'انوینٹری قیمت', sellMedicine: 'دوائی بیچیں', addInventory: 'انوینٹری شامل کریں', csvUpload: 'CSV اپ لوڈ', restockRequests: 'ری اسٹاک درخواستیں', pendingRestocks: 'زیر التوا درخواستیں', accept: 'قبول', reject: 'مسترد', fulfill: 'پورا کریں', inventory: 'انوینٹری', searchMedicines: 'دوائیں تلاش...', addItem: 'آئٹم شامل', noInventory: 'کوئی انوینٹری نہیں۔', distance: 'فاصلہ', requestAccepted: 'درخواست قبول', requestRejected: 'درخواست مسترد', requestFulfilled: 'درخواست پوری',
    diagnosticDashboard: 'ڈائیگنوسٹک سینٹر ڈیش بورڈ', manageBookings: 'بکنگ منظم کریں', totalBookings: 'کل بکنگ', pending: 'زیر التوا', accepted: 'قبول شدہ', completed: 'مکمل', bookingRequests: 'بکنگ درخواستیں', noBookings: 'کوئی بکنگ نہیں۔', complete: 'مکمل کریں', done: 'ہو گیا', bookingUpdated: 'بکنگ اپ ڈیٹ', statusChanged: 'حیثیت تبدیل', userName: 'صارف نام', testTypeCol: 'ٹیسٹ', requestedDate: 'درخواست تاریخ', time: 'وقت', notes: 'نوٹس',
    hospitalDashboard: 'ہسپتال ڈیش بورڈ', manageInventoryAdherence: 'انوینٹری اور پابندی منظم کریں', addMedicineScan: 'دوائی شامل کریں', medicineInventory: 'دوائی انوینٹری', noInventoryYet: 'ابھی تک کوئی انوینٹری نہیں۔', patientAdherence: 'مریض پابندی',
    locationRequested: 'مقام کی اجازت', locationDenied: 'مقام کی اجازت نہیں دی گئی۔', restockSent: 'ری اسٹاک درخواست بھیجی', restockDesc: 'قریبی فارمیسیوں کو بھیجی گئی۔', requestFor: 'درخواست',
    safe: 'محفوظ', expiring: 'ختم ہونے والا',
    heroTitle: 'آپ کا مکمل دوائی ٹریکنگ پلیٹ فارم', heroSubtitle: 'MediVault کے ساتھ دوائیں ٹریک کریں۔', getStarted: 'شروع کریں', learnMore: 'مزید جانیں', features: 'خصوصیات', about: 'تعارف', contact: 'رابطہ',
  },
  te: {
    dashboard: 'డ్యాష్‌బోర్డ్', settings: 'సెట్టింగ్‌లు', logout: 'లాగ్ అవుట్', save: 'సేవ్', cancel: 'రద్దు', submit: 'సమర్పించు', loading: 'లోడ్ అవుతోంది...', search: 'శోధన', actions: 'చర్యలు', status: 'స్థితి', date: 'తేదీ', name: 'పేరు', email: 'ఇమెయిల్', mobile: 'మొబైల్', language: 'భాష',
    login: 'లాగిన్', register: 'ప్రారంభించండి', signUp: 'సైన్ అప్',
    welcomeBack: 'తిరిగి స్వాగతం', medicineOverview: 'మీ మందుల అవలోకనం', totalMedicines: 'మొత్తం మందులు', expiringSoon: 'త్వరలో గడువు', expired: 'గడువు ముగిసింది', lowStock: 'తక్కువ స్టాక్', quickActions: 'త్వరిత చర్యలు', scanQR: 'QR స్కాన్', manualEntry: 'మాన్యువల్ ఎంట్రీ', bookTest: 'టెస్ట్ బుక్', addMedicine: 'మందు జోడించు', myMedicines: 'నా మందులు', myBloodTestBookings: 'నా రక్త పరీక్ష బుకింగ్‌లు', noBookingsYet: 'ఇంకా బుకింగ్‌లు లేవు.', noMedicinesYet: 'ఇంకా మందులు జోడించలేదు.', restockNow: 'రీస్టాక్', outOfStock: 'స్టాక్ అయిపోయింది', confirmed: 'మీ అపాయింట్‌మెంట్ నిర్ధారించబడింది.',
    bookBloodTest: 'రక్త పరీక్ష బుక్', testType: 'పరీక్ష రకం', selectTestType: 'రకం ఎంచుకోండి', preferredDate: 'ఇష్టపడే తేదీ', preferredTime: 'ఇష్టపడే సమయం', additionalNotes: 'అదనపు నోట్స్', bookingCreated: 'బుకింగ్ విజయవంతం', bookingDesc: 'మీ అభ్యర్థన పంపబడింది.', bookAppointment: 'అపాయింట్‌మెంట్ బుక్', booking: 'బుక్ అవుతోంది...',
    medicineName: 'మందు పేరు', batchNumber: 'బ్యాచ్ నంబర్', expiryDate: 'గడువు తేదీ', quantity: 'పరిమాణం', dosage: 'మోతాదు', prescribedDoses: 'నిర్ణయించిన మోతాదులు', medicineAdded: 'మందు జోడించబడింది', addMedicineTitle: 'మందు జోడించు', qrScan: 'QR స్కాన్', manual: 'మాన్యువల్', simulateQR: 'QR స్కాన్ సిమ్యులేట్', qrScanned: 'QR స్కాన్ అయింది', qrDesc: 'వివరాలు నింపబడ్డాయి.', cameraNotAvailable: 'కెమెరా అందుబాటులో లేదు.', clickSimulate: 'సిమ్యులేట్ చేయడానికి క్లిక్ చేయండి.',
    adherence: 'పాటించడం', takeDose: 'మోతాదు తీసుకోండి', doseTaken: 'మోతాదు నమోదు', doseDesc: 'మీ పాటించడం నవీకరించబడింది.', adherenceScore: 'పాటించడం స్కోర్',
    pharmacyDashboard: 'ఫార్మసీ డ్యాష్‌బోర్డ్', manageInventory: 'ఇన్వెంటరీ నిర్వహించండి', totalItems: 'మొత్తం ఐటెమ్‌లు', inventoryValue: 'ఇన్వెంటరీ విలువ', sellMedicine: 'మందు అమ్మండి', addInventory: 'ఇన్వెంటరీ జోడించు', csvUpload: 'CSV అప్‌లోడ్', restockRequests: 'రీస్టాక్ అభ్యర్థనలు', pendingRestocks: 'పెండింగ్ రీస్టాక్ అభ్యర్థనలు', accept: 'ఆమోదించు', reject: 'తిరస్కరించు', fulfill: 'పూర్తి చేయి', inventory: 'ఇన్వెంటరీ', searchMedicines: 'మందులు శోధించు...', addItem: 'ఐటెమ్ జోడించు', noInventory: 'ఇన్వెంటరీ లేదు.', distance: 'దూరం', requestAccepted: 'అభ్యర్థన ఆమోదించబడింది', requestRejected: 'అభ్యర్థన తిరస్కరించబడింది', requestFulfilled: 'అభ్యర్థన పూర్తయింది',
    diagnosticDashboard: 'డయాగ్నస్టిక్ సెంటర్ డ్యాష్‌బోర్డ్', manageBookings: 'బుకింగ్‌లు నిర్వహించండి', totalBookings: 'మొత్తం బుకింగ్‌లు', pending: 'పెండింగ్', accepted: 'ఆమోదించబడింది', completed: 'పూర్తయింది', bookingRequests: 'బుకింగ్ అభ్యర్థనలు', noBookings: 'బుకింగ్‌లు లేవు.', complete: 'పూర్తి చేయి', done: 'పూర్తయింది', bookingUpdated: 'బుకింగ్ నవీకరించబడింది', statusChanged: 'స్థితి మారింది', userName: 'వినియోగదారు పేరు', testTypeCol: 'పరీక్ష', requestedDate: 'అభ్యర్థన తేదీ', time: 'సమయం', notes: 'నోట్స్',
    hospitalDashboard: 'ఆసుపత్రి డ్యాష్‌బోర్డ్', manageInventoryAdherence: 'ఇన్వెంటరీ నిర్వహించండి', addMedicineScan: 'మందు జోడించు', medicineInventory: 'మందు ఇన్వెంటరీ', noInventoryYet: 'ఇంకా ఇన్వెంటరీ లేదు.', patientAdherence: 'రోగి పాటించడం',
    locationRequested: 'స్థానం అనుమతి', locationDenied: 'స్థానం నిరాకరించబడింది.', restockSent: 'రీస్టాక్ అభ్యర్థన పంపబడింది', restockDesc: 'సమీప ఫార్మసీలకు పంపబడింది.', requestFor: 'అభ్యర్థన',
    safe: 'సురక్షితం', expiring: 'గడువు ముగుస్తోంది',
    heroTitle: 'మీ సంపూర్ణ మందు ట్రాకింగ్ ప్లాట్‌ఫాం', heroSubtitle: 'MediVault తో మందులను ట్రాక్ చేయండి.', getStarted: 'ప్రారంభించండి', learnMore: 'మరింత తెలుసుకోండి', features: 'ఫీచర్లు', about: 'గురించి', contact: 'సంప్రదించండి',
  },
  mr: {
    dashboard: 'डॅशबोर्ड', settings: 'सेटिंग्ज', logout: 'लॉग आउट', save: 'सेव्ह', cancel: 'रद्द', submit: 'सबमिट', loading: 'लोड होत आहे...', search: 'शोधा', actions: 'कृती', status: 'स्थिती', date: 'तारीख', name: 'नाव', email: 'ईमेल', mobile: 'मोबाइल', language: 'भाषा',
    login: 'लॉग इन', register: 'सुरू करा', signUp: 'साइन अप',
    welcomeBack: 'परत स्वागत', medicineOverview: 'तुमच्या औषधांचा आढावा', totalMedicines: 'एकूण औषधे', expiringSoon: 'लवकर संपणारी', expired: 'संपलेली', lowStock: 'कमी साठा', quickActions: 'त्वरित कृती', scanQR: 'QR स्कॅन', manualEntry: 'मॅन्युअल एंट्री', bookTest: 'टेस्ट बुक करा', addMedicine: 'औषध जोडा', myMedicines: 'माझी औषधे', myBloodTestBookings: 'माझ्या रक्त चाचणी बुकिंग', noBookingsYet: 'अजून बुकिंग नाहीत.', noMedicinesYet: 'अजून औषधे जोडली नाहीत.', restockNow: 'रीस्टॉक', outOfStock: 'साठा संपला', confirmed: 'तुमची अपॉइंटमेंट पुष्टी झाली.',
    bookBloodTest: 'रक्त चाचणी बुक करा', testType: 'चाचणी प्रकार', selectTestType: 'प्रकार निवडा', preferredDate: 'प्राधान्य तारीख', preferredTime: 'प्राधान्य वेळ', additionalNotes: 'अतिरिक्त नोट्स', bookingCreated: 'बुकिंग यशस्वी', bookingDesc: 'तुमची विनंती पाठवली गेली.', bookAppointment: 'अपॉइंटमेंट बुक करा', booking: 'बुक होत आहे...',
    medicineName: 'औषधाचे नाव', batchNumber: 'बॅच क्रमांक', expiryDate: 'एक्सपायरी तारीख', quantity: 'प्रमाण', dosage: 'डोस', prescribedDoses: 'निर्धारित डोस', medicineAdded: 'औषध जोडले', addMedicineTitle: 'औषध जोडा', qrScan: 'QR स्कॅन', manual: 'मॅन्युअल', simulateQR: 'QR स्कॅन सिम्युलेट', qrScanned: 'QR स्कॅन झाले', qrDesc: 'तपशील भरले गेले.', cameraNotAvailable: 'कॅमेरा उपलब्ध नाही.', clickSimulate: 'सिम्युलेट करण्यासाठी क्लिक करा.',
    adherence: 'पालन', takeDose: 'डोस घ्या', doseTaken: 'डोस नोंदवला', doseDesc: 'तुमचे पालन अपडेट झाले.', adherenceScore: 'पालन स्कोअर',
    pharmacyDashboard: 'फार्मसी डॅशबोर्ड', manageInventory: 'इन्व्हेंटरी व्यवस्थापित करा', totalItems: 'एकूण आयटम', inventoryValue: 'इन्व्हेंटरी मूल्य', sellMedicine: 'औषध विका', addInventory: 'इन्व्हेंटरी जोडा', csvUpload: 'CSV अपलोड', restockRequests: 'रीस्टॉक विनंत्या', pendingRestocks: 'प्रलंबित रीस्टॉक विनंत्या', accept: 'स्वीकारा', reject: 'नाकारा', fulfill: 'पूर्ण करा', inventory: 'इन्व्हेंटरी', searchMedicines: 'औषधे शोधा...', addItem: 'आयटम जोडा', noInventory: 'इन्व्हेंटरी नाही.', distance: 'अंतर', requestAccepted: 'विनंती स्वीकृत', requestRejected: 'विनंती नाकारली', requestFulfilled: 'विनंती पूर्ण',
    diagnosticDashboard: 'डायग्नोस्टिक सेंटर डॅशबोर्ड', manageBookings: 'बुकिंग व्यवस्थापित करा', totalBookings: 'एकूण बुकिंग', pending: 'प्रलंबित', accepted: 'स्वीकृत', completed: 'पूर्ण', bookingRequests: 'बुकिंग विनंत्या', noBookings: 'बुकिंग नाहीत.', complete: 'पूर्ण करा', done: 'झाले', bookingUpdated: 'बुकिंग अपडेट', statusChanged: 'स्थिती बदलली', userName: 'वापरकर्ता नाव', testTypeCol: 'चाचणी', requestedDate: 'विनंती तारीख', time: 'वेळ', notes: 'नोट्स',
    hospitalDashboard: 'रुग्णालय डॅशबोर्ड', manageInventoryAdherence: 'इन्व्हेंटरी व्यवस्थापित करा', addMedicineScan: 'औषध जोडा', medicineInventory: 'औषध इन्व्हेंटरी', noInventoryYet: 'अजून इन्व्हेंटरी नाही.', patientAdherence: 'रुग्ण पालन',
    locationRequested: 'स्थान परवानगी', locationDenied: 'स्थान नाकारले.', restockSent: 'रीस्टॉक विनंती पाठवली', restockDesc: 'जवळच्या फार्मसींना पाठवली.', requestFor: 'विनंती',
    safe: 'सुरक्षित', expiring: 'संपत आहे',
    heroTitle: 'तुमचे संपूर्ण औषध ट्रॅकिंग प्लॅटफॉर्म', heroSubtitle: 'MediVault सह औषधे ट्रॅक करा.', getStarted: 'सुरू करा', learnMore: 'अधिक जाणून घ्या', features: 'वैशिष्ट्ये', about: 'परिचय', contact: 'संपर्क',
  },
  kn: {
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು', logout: 'ಲಾಗ್ ಔಟ್', save: 'ಉಳಿಸಿ', cancel: 'ರದ್ದು', submit: 'ಸಲ್ಲಿಸಿ', loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...', search: 'ಹುಡುಕಿ', actions: 'ಕ್ರಿಯೆಗಳು', status: 'ಸ್ಥಿತಿ', date: 'ದಿನಾಂಕ', name: 'ಹೆಸರು', email: 'ಇಮೇಲ್', mobile: 'ಮೊಬೈಲ್', language: 'ಭಾಷೆ',
    login: 'ಲಾಗಿನ್', register: 'ಪ್ರಾರಂಭಿಸಿ', signUp: 'ಸೈನ್ ಅಪ್',
    welcomeBack: 'ಮರಳಿ ಸ್ವಾಗತ', medicineOverview: 'ನಿಮ್ಮ ಔಷಧಿಗಳ ಅವಲೋಕನ', totalMedicines: 'ಒಟ್ಟು ಔಷಧಿಗಳು', expiringSoon: 'ಶೀಘ್ರ ಮುಕ್ತಾಯ', expired: 'ಮುಕ್ತಾಯ', lowStock: 'ಕಡಿಮೆ ಸ್ಟಾಕ್', quickActions: 'ತ್ವರಿತ ಕ್ರಿಯೆಗಳು', scanQR: 'QR ಸ್ಕ್ಯಾನ್', manualEntry: 'ಮ್ಯಾನ್ಯುಯಲ್ ಎಂಟ್ರಿ', bookTest: 'ಟೆಸ್ಟ್ ಬುಕ್', addMedicine: 'ಔಷಧಿ ಸೇರಿಸಿ', myMedicines: 'ನನ್ನ ಔಷಧಿಗಳು', myBloodTestBookings: 'ನನ್ನ ರಕ್ತ ಪರೀಕ್ಷೆ ಬುಕಿಂಗ್‌ಗಳು', noBookingsYet: 'ಇನ್ನೂ ಬುಕಿಂಗ್‌ಗಳಿಲ್ಲ.', noMedicinesYet: 'ಇನ್ನೂ ಔಷಧಿಗಳನ್ನು ಸೇರಿಸಿಲ್ಲ.', restockNow: 'ರೀಸ್ಟಾಕ್', outOfStock: 'ಸ್ಟಾಕ್ ಮುಗಿದಿದೆ', confirmed: 'ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ.',
    bookBloodTest: 'ರಕ್ತ ಪರೀಕ್ಷೆ ಬುಕ್', testType: 'ಪರೀಕ್ಷೆ ವಿಧ', selectTestType: 'ವಿಧ ಆಯ್ಕೆ', preferredDate: 'ಆದ್ಯತೆ ದಿನಾಂಕ', preferredTime: 'ಆದ್ಯತೆ ಸಮಯ', additionalNotes: 'ಹೆಚ್ಚುವರಿ ಟಿಪ್ಪಣಿ', bookingCreated: 'ಬುಕಿಂಗ್ ಯಶಸ್ವಿ', bookingDesc: 'ನಿಮ್ಮ ವಿನಂತಿ ಕಳುಹಿಸಲಾಗಿದೆ.', bookAppointment: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್', booking: 'ಬುಕ್ ಆಗುತ್ತಿದೆ...',
    medicineName: 'ಔಷಧಿ ಹೆಸರು', batchNumber: 'ಬ್ಯಾಚ್ ಸಂಖ್ಯೆ', expiryDate: 'ಮುಕ್ತಾಯ ದಿನಾಂಕ', quantity: 'ಪ್ರಮಾಣ', dosage: 'ಡೋಸ್', prescribedDoses: 'ನಿಗದಿತ ಡೋಸ್', medicineAdded: 'ಔಷಧಿ ಸೇರಿಸಲಾಗಿದೆ', addMedicineTitle: 'ಔಷಧಿ ಸೇರಿಸಿ', qrScan: 'QR ಸ್ಕ್ಯಾನ್', manual: 'ಮ್ಯಾನ್ಯುಯಲ್', simulateQR: 'QR ಸ್ಕ್ಯಾನ್ ಸಿಮ್ಯುಲೇಟ್', qrScanned: 'QR ಸ್ಕ್ಯಾನ್ ಆಗಿದೆ', qrDesc: 'ವಿವರಗಳು ಭರ್ತಿಯಾಗಿವೆ.', cameraNotAvailable: 'ಕ್ಯಾಮೆರಾ ಲಭ್ಯವಿಲ್ಲ.', clickSimulate: 'ಸಿಮ್ಯುಲೇಟ್ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ.',
    adherence: 'ಅನುಸರಣೆ', takeDose: 'ಡೋಸ್ ತೆಗೆದುಕೊಳ್ಳಿ', doseTaken: 'ಡೋಸ್ ದಾಖಲು', doseDesc: 'ನಿಮ್ಮ ಅನುಸರಣೆ ನವೀಕರಿಸಲಾಗಿದೆ.', adherenceScore: 'ಅನುಸರಣೆ ಸ್ಕೋರ್',
    pharmacyDashboard: 'ಫಾರ್ಮಸಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', manageInventory: 'ಇನ್ವೆಂಟರಿ ನಿರ್ವಹಿಸಿ', totalItems: 'ಒಟ್ಟು ಐಟಂಗಳು', inventoryValue: 'ಇನ್ವೆಂಟರಿ ಮೌಲ್ಯ', sellMedicine: 'ಔಷಧಿ ಮಾರಿ', addInventory: 'ಇನ್ವೆಂಟರಿ ಸೇರಿಸಿ', csvUpload: 'CSV ಅಪ್‌ಲೋಡ್', restockRequests: 'ರೀಸ್ಟಾಕ್ ವಿನಂತಿಗಳು', pendingRestocks: 'ಬಾಕಿ ರೀಸ್ಟಾಕ್ ವಿನಂತಿಗಳು', accept: 'ಸ್ವೀಕರಿಸಿ', reject: 'ತಿರಸ್ಕರಿಸಿ', fulfill: 'ಪೂರ್ಣಗೊಳಿಸಿ', inventory: 'ಇನ್ವೆಂಟರಿ', searchMedicines: 'ಔಷಧಿಗಳನ್ನು ಹುಡುಕಿ...', addItem: 'ಐಟಂ ಸೇರಿಸಿ', noInventory: 'ಇನ್ವೆಂಟರಿ ಇಲ್ಲ.', distance: 'ದೂರ', requestAccepted: 'ವಿನಂತಿ ಸ್ವೀಕೃತ', requestRejected: 'ವಿನಂತಿ ತಿರಸ್ಕೃತ', requestFulfilled: 'ವಿನಂತಿ ಪೂರ್ಣ',
    diagnosticDashboard: 'ಡಯಾಗ್ನೋಸ್ಟಿಕ್ ಸೆಂಟರ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', manageBookings: 'ಬುಕಿಂಗ್ ನಿರ್ವಹಿಸಿ', totalBookings: 'ಒಟ್ಟು ಬುಕಿಂಗ್', pending: 'ಬಾಕಿ', accepted: 'ಸ್ವೀಕೃತ', completed: 'ಪೂರ್ಣ', bookingRequests: 'ಬುಕಿಂಗ್ ವಿನಂತಿಗಳು', noBookings: 'ಬುಕಿಂಗ್ ಇಲ್ಲ.', complete: 'ಪೂರ್ಣಗೊಳಿಸಿ', done: 'ಮುಗಿದಿದೆ', bookingUpdated: 'ಬುಕಿಂಗ್ ನವೀಕರಿಸಲಾಗಿದೆ', statusChanged: 'ಸ್ಥಿತಿ ಬದಲಾಗಿದೆ', userName: 'ಬಳಕೆದಾರ ಹೆಸರು', testTypeCol: 'ಪರೀಕ್ಷೆ', requestedDate: 'ವಿನಂತಿ ದಿನಾಂಕ', time: 'ಸಮಯ', notes: 'ಟಿಪ್ಪಣಿ',
    hospitalDashboard: 'ಆಸ್ಪತ್ರೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', manageInventoryAdherence: 'ಇನ್ವೆಂಟರಿ ನಿರ್ವಹಿಸಿ', addMedicineScan: 'ಔಷಧಿ ಸೇರಿಸಿ', medicineInventory: 'ಔಷಧಿ ಇನ್ವೆಂಟರಿ', noInventoryYet: 'ಇನ್ನೂ ಇನ್ವೆಂಟರಿ ಇಲ್ಲ.', patientAdherence: 'ರೋಗಿ ಅನುಸರಣೆ',
    locationRequested: 'ಸ್ಥಳ ಅನುಮತಿ', locationDenied: 'ಸ್ಥಳ ನಿರಾಕರಿಸಲಾಗಿದೆ.', restockSent: 'ರೀಸ್ಟಾಕ್ ವಿನಂತಿ ಕಳುಹಿಸಲಾಗಿದೆ', restockDesc: 'ಹತ್ತಿರದ ಫಾರ್ಮಸಿಗಳಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.', requestFor: 'ವಿನಂತಿ',
    safe: 'ಸುರಕ್ಷಿತ', expiring: 'ಮುಕ್ತಾಯ ಹತ್ತಿರ',
    heroTitle: 'ನಿಮ್ಮ ಸಂಪೂರ್ಣ ಔಷಧಿ ಟ್ರ್ಯಾಕಿಂಗ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್', heroSubtitle: 'MediVault ನೊಂದಿಗೆ ಔಷಧಿಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.', getStarted: 'ಪ್ರಾರಂಭಿಸಿ', learnMore: 'ಹೆಚ್ಚು ತಿಳಿಯಿರಿ', features: 'ವೈಶಿಷ್ಟ್ಯಗಳು', about: 'ಬಗ್ಗೆ', contact: 'ಸಂಪರ್ಕ',
  },
};

const languageNames: Record<Language, string> = {
  en: 'English',
  hi: 'हिंदी',
  ur: 'اردو',
  te: 'తెలుగు',
  mr: 'मराठी',
  kn: 'ಕನ್ನಡ',
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languageNames: Record<Language, string>;
  allLanguages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const { user, profile } = useAuth();

  // Load language from profile on mount
  useEffect(() => {
    if (profile?.language) {
      const lang = profile.language as Language;
      if (translations[lang]) setLanguageState(lang);
    }
  }, [profile]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    // Persist to profile
    if (user) {
      await supabase.from('profiles').update({ language: lang } as any).eq('user_id', user.id);
    }
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languageNames, allLanguages: Object.keys(translations) as Language[] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
