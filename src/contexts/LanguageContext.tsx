import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type Language = 'en' | 'hi' | 'ur' | 'te' | 'mr' | 'kn';

interface LanguageLabels {
  [key: string]: string;
}

const en: LanguageLabels = {
  // Common
  dashboard: 'Dashboard', settings: 'Settings', logout: 'Log out', save: 'Save', cancel: 'Cancel', submit: 'Submit', loading: 'Loading...', search: 'Search', actions: 'Actions', status: 'Status', date: 'Date', name: 'Name', email: 'Email', mobile: 'Mobile', language: 'Language', edit: 'Edit', delete: 'Delete', active: 'Active', paused: 'Paused', notSet: 'Not set', verified: 'Verified',
  // Auth
  login: 'Log in', register: 'Get Started', signUp: 'Sign Up',
  // User Dashboard
  welcomeBack: 'Welcome back', medicineOverview: "Here's your medicine overview", totalMedicines: 'Total Medicines', expiringSoon: 'Expiring Soon', expired: 'Expired', lowStock: 'Low Stock', quickActions: 'Quick Actions', scanQR: 'Scan QR', manualEntry: 'Manual Entry', bookTest: 'Book Test', addMedicine: 'Add Medicine', myMedicines: 'My Medicines', myBloodTestBookings: 'My Blood Test Bookings', myRestockRequests: 'My Restock Requests', noBookingsYet: 'No blood test bookings yet.', noMedicinesYet: 'No medicines added yet. Add your first medicine to start tracking.', restockNow: 'Restock', outOfStock: 'Out of stock', confirmed: 'Confirmed',
  // Navigation sections
  medicineReminders: 'Medicine Reminders', restockRequests: 'Restock Requests', bloodTestBookings: 'Blood Test Bookings', notifications: 'Notifications', profile: 'Profile', personalInfo: 'Personal Information', profileUpdated: 'Profile Updated',
  // Reminders
  addReminder: 'Add Reminder', reminderAdded: 'Reminder Added', reminderDeleted: 'Reminder Deleted', noReminders: 'No reminders set. Add a reminder to get daily medicine notifications.', reminderTime: 'Reminder Time', reminder: 'Reminder', timeToTakeMedicine: 'Time to take your medicine',
  // Notifications
  markAllRead: 'Mark All Read', noNotifications: 'No notifications yet.',
  // Requests
  activeRequests: 'Active Requests', completedRequests: 'Completed Requests', noRestockRequests: 'No restock requests yet.', activeBookings: 'Active Bookings', completedBookings: 'Completed Bookings',
  // Booking
  bookBloodTest: 'Book Blood Test', testType: 'Test Type', selectTestType: 'Select test type', preferredDate: 'Preferred Date', preferredTime: 'Preferred Time', additionalNotes: 'Additional Notes', bookingCreated: 'Blood Test Booking Created Successfully', bookingDesc: 'Your booking request has been sent to diagnostic centres.', bookAppointment: 'Book Appointment', booking: 'Booking...',
  // Medicine
  medicineName: 'Medicine Name', batchNumber: 'Batch Number', expiryDate: 'Expiry Date', quantity: 'Quantity', dosage: 'Dosage', prescribedDoses: 'Prescribed Doses', medicineAdded: 'Medicine Added', addMedicineTitle: 'Add Medicine', qrScan: 'QR Scan', manual: 'Manual', simulateQR: 'Simulate QR Scan', qrScanned: 'QR Scanned', qrDesc: 'Medicine details populated. Review and save.', cameraNotAvailable: 'Camera not available in this environment.', clickSimulate: 'Click below to simulate a scan.',
  // Adherence
  adherence: 'Adherence', takeDose: 'Take Dose', doseTaken: 'Dose Recorded', doseDesc: 'Your adherence has been updated.', adherenceScore: 'Adherence Score',
  // Pharmacy
  pharmacyDashboard: 'Pharmacy Dashboard', manageInventory: 'Manage your inventory and sales', totalItems: 'Total Items', inventoryValue: 'Inventory Value', sellMedicine: 'Sell Medicine', addInventory: 'Add Inventory', csvUpload: 'CSV Upload', pendingRestocks: 'Pending Restock Requests', accept: 'Accept', reject: 'Reject', fulfill: 'Fulfill', fulfilled: 'Fulfilled', inventory: 'Inventory', searchMedicines: 'Search medicines...', addItem: 'Add Item', noInventory: 'No inventory items. Add your first item to get started.', distance: 'Distance', requestAccepted: 'Request accepted', requestRejected: 'Request rejected', requestFulfilled: 'Request fulfilled',
  // Blood Test Centre
  diagnosticDashboard: 'Diagnostic Centre Dashboard', manageBookings: 'Manage blood test bookings', totalBookings: 'Total Bookings', pending: 'Pending', accepted: 'Accepted', completed: 'Completed', completedTests: 'Completed Tests', bookingRequests: 'Booking Requests', noBookings: 'No bookings yet.', complete: 'Complete', done: 'Done', bookingUpdated: 'Booking Updated', statusChanged: 'Status changed to', userName: 'User Name', testTypeCol: 'Test Type', requestedDate: 'Requested Date', time: 'Time', notes: 'Notes',
  // Hospital
  hospitalDashboard: 'Hospital Dashboard', manageInventoryAdherence: 'Manage inventory and patient adherence', addMedicineScan: 'Add Medicine (Scan/Manual)', medicineInventory: 'Medicine Inventory', noInventoryYet: 'No inventory items yet. Add your first medicine.', patientAdherence: 'Patient Adherence',
  // Location
  locationRequested: 'Location access requested', locationDenied: 'Location access denied. Request will be sent to all providers.', restockSent: 'Restock Request Sent', restockDesc: 'sent to nearby pharmacies.', requestFor: 'Request for', openMap: 'Open in Maps', viewLocation: 'View Location', noLocation: 'No location', location: 'Location', saveLocation: 'Save My Location', locationSaved: 'Location saved successfully',
  // Offer system
  sendOffer: 'Send Offer', sendRestockOffer: 'Send Restock Offer', sendTestOffer: 'Send Test Offer', price: 'Price', discount: 'Discount', finalPrice: 'Final Price', estimatedTime: 'Estimated Time', estimatedTimePlaceholder: 'e.g. 30 minutes, 2 hours', offerNotesPlaceholder: 'Any additional details...', offerSent: 'Offer Sent', offersSent: 'Offers Sent', offersReceived: 'Offers Received', newOffer: 'New Offer', acceptOffer: 'Accept', rejectOffer: 'Reject', offerAccepted: 'Offer Accepted', offerRejected: 'Offer Rejected', from: 'From', provider: 'Provider', diagnosticCentre: 'Diagnostic Centre', pharmacy: 'Pharmacy', processing: 'Processing', rejected: 'Rejected', orderTracking: 'Tracking', statusUpdated: 'Status Updated',
  // Status
  safe: 'Safe', expiring: 'Expiring',
  // Index
  heroTitle: 'Your Complete Medicine Tracking Platform', heroSubtitle: 'Track medications, manage inventory, book blood tests, and stay on top of your health with MediVault.', getStarted: 'Get Started', learnMore: 'Learn More', features: 'Features', about: 'About', contact: 'Contact',
};

const hi: LanguageLabels = {
  ...en,
  dashboard: 'डैशबोर्ड', settings: 'सेटिंग्स', logout: 'लॉग आउट', save: 'सेव करें', cancel: 'रद्द करें', submit: 'जमा करें', loading: 'लोड हो रहा है...', search: 'खोजें', language: 'भाषा', edit: 'संपादित करें', delete: 'हटाएं', active: 'सक्रिय', paused: 'रुका हुआ', notSet: 'सेट नहीं है', verified: 'सत्यापित',
  login: 'लॉग इन', register: 'शुरू करें', signUp: 'साइन अप',
  welcomeBack: 'वापस स्वागत है', totalMedicines: 'कुल दवाइयां', expiringSoon: 'जल्दी समाप्त', expired: 'समाप्त', lowStock: 'कम स्टॉक', quickActions: 'त्वरित कार्य', scanQR: 'QR स्कैन', manualEntry: 'मैन्युअल एंट्री', bookTest: 'टेस्ट बुक करें', addMedicine: 'दवा जोड़ें', myMedicines: 'मेरी दवाइयां', myBloodTestBookings: 'मेरी रक्त परीक्षण बुकिंग', myRestockRequests: 'मेरे रीस्टॉक अनुरोध', confirmed: 'पुष्टि हो गई',
  medicineReminders: 'दवा रिमाइंडर', restockRequests: 'रीस्टॉक अनुरोध', bloodTestBookings: 'रक्त परीक्षण बुकिंग', notifications: 'सूचनाएं', profile: 'प्रोफ़ाइल', personalInfo: 'व्यक्तिगत जानकारी', profileUpdated: 'प्रोफ़ाइल अपडेट हो गई',
  addReminder: 'रिमाइंडर जोड़ें', reminderAdded: 'रिमाइंडर जोड़ा गया', reminderDeleted: 'रिमाइंडर हटाया गया', noReminders: 'कोई रिमाइंडर नहीं। दैनिक दवा सूचनाओं के लिए रिमाइंडर जोड़ें।', reminderTime: 'रिमाइंडर समय', reminder: 'रिमाइंडर', timeToTakeMedicine: 'अपनी दवा लेने का समय',
  markAllRead: 'सभी पढ़ा हुआ', noNotifications: 'अभी कोई सूचना नहीं।',
  activeRequests: 'सक्रिय अनुरोध', completedRequests: 'पूर्ण अनुरोध', noRestockRequests: 'अभी कोई रीस्टॉक अनुरोध नहीं।', activeBookings: 'सक्रिय बुकिंग', completedBookings: 'पूर्ण बुकिंग',
  bookBloodTest: 'रक्त परीक्षण बुक करें', testType: 'परीक्षण प्रकार', selectTestType: 'परीक्षण प्रकार चुनें', preferredDate: 'पसंदीदा तारीख', preferredTime: 'पसंदीदा समय', additionalNotes: 'अतिरिक्त नोट्स', bookingCreated: 'रक्त परीक्षण बुकिंग सफल', bookingDesc: 'आपका अनुरोध डायग्नोस्टिक सेंटरों को भेजा गया।', bookAppointment: 'अपॉइंटमेंट बुक करें', booking: 'बुक हो रहा है...',
  medicineName: 'दवा का नाम', batchNumber: 'बैच नंबर', expiryDate: 'समाप्ति तिथि', quantity: 'मात्रा', dosage: 'खुराक', prescribedDoses: 'निर्धारित खुराक', medicineAdded: 'दवा जोड़ी गई', adherence: 'पालन', takeDose: 'खुराक लें', doseTaken: 'खुराक दर्ज', doseDesc: 'आपका पालन अपडेट किया गया।',
  pharmacyDashboard: 'फार्मेसी डैशबोर्ड', manageInventory: 'अपनी इन्वेंट्री और बिक्री प्रबंधित करें', totalItems: 'कुल आइटम', inventoryValue: 'इन्वेंट्री मूल्य', sellMedicine: 'दवा बेचें', addInventory: 'इन्वेंट्री जोड़ें', csvUpload: 'CSV अपलोड', accept: 'स्वीकार', reject: 'अस्वीकार', fulfill: 'पूरा करें', fulfilled: 'पूरा हुआ', inventory: 'इन्वेंट्री', distance: 'दूरी',
  diagnosticDashboard: 'डायग्नोस्टिक सेंटर डैशबोर्ड', manageBookings: 'रक्त परीक्षण बुकिंग प्रबंधित करें', totalBookings: 'कुल बुकिंग', pending: 'लंबित', accepted: 'स्वीकृत', completed: 'पूर्ण', completedTests: 'पूर्ण परीक्षण', bookingRequests: 'बुकिंग अनुरोध', complete: 'पूरा करें', done: 'हो गया',
  openMap: 'मानचित्र में खोलें', viewLocation: 'स्थान देखें', noLocation: 'स्थान नहीं', location: 'स्थान', saveLocation: 'मेरा स्थान सेव करें', locationSaved: 'स्थान सफलतापूर्वक सेव किया गया',
  sendOffer: 'ऑफर भेजें', sendRestockOffer: 'रीस्टॉक ऑफर भेजें', sendTestOffer: 'टेस्ट ऑफर भेजें', price: 'कीमत', discount: 'छूट', finalPrice: 'अंतिम कीमत', estimatedTime: 'अनुमानित समय', offerSent: 'ऑफर भेजा गया', offersSent: 'ऑफर भेजे गए', offersReceived: 'प्राप्त ऑफर', newOffer: 'नया ऑफर', acceptOffer: 'स्वीकार', rejectOffer: 'अस्वीकार', offerAccepted: 'ऑफर स्वीकृत', offerRejected: 'ऑफर अस्वीकृत', from: 'से', provider: 'प्रदाता', diagnosticCentre: 'डायग्नोस्टिक सेंटर', pharmacy: 'फार्मेसी', processing: 'प्रोसेसिंग', rejected: 'अस्वीकृत', orderTracking: 'ट्रैकिंग', statusUpdated: 'स्थिति अपडेट',
  safe: 'सुरक्षित', expiring: 'समाप्त होने वाला',
  heroTitle: 'आपका संपूर्ण दवा ट्रैकिंग प्लेटफ़ॉर्म', heroSubtitle: 'MediVault के साथ दवाइयों को ट्रैक करें।', getStarted: 'शुरू करें', learnMore: 'और जानें', features: 'सुविधाएं', about: 'परिचय', contact: 'संपर्क',
};

const ur: LanguageLabels = {
  ...en,
  dashboard: 'ڈیش بورڈ', settings: 'ترتیبات', logout: 'لاگ آؤٹ', save: 'محفوظ کریں', cancel: 'منسوخ', submit: 'جمع کریں', loading: 'لوڈ ہو رہا ہے...', search: 'تلاش', language: 'زبان', edit: 'ترمیم', delete: 'حذف', active: 'فعال', paused: 'موقوف', notSet: 'سیٹ نہیں', verified: 'تصدیق شدہ',
  login: 'لاگ ان', register: 'شروع کریں', signUp: 'سائن اپ',
  welcomeBack: 'واپسی پر خوش آمدید', pending: 'زیر التوا', accepted: 'قبول شدہ', completed: 'مکمل', accept: 'قبول', reject: 'مسترد', fulfill: 'پورا کریں', fulfilled: 'پورا ہوا', confirmed: 'تصدیق شدہ',
  medicineReminders: 'دوائی یاد دہانی', restockRequests: 'ری اسٹاک درخواستیں', bloodTestBookings: 'خون کے ٹیسٹ بکنگ', notifications: 'اطلاعات', profile: 'پروفائل', personalInfo: 'ذاتی معلومات', profileUpdated: 'پروفائل اپڈیٹ',
  addReminder: 'یاد دہانی شامل کریں', reminderAdded: 'یاد دہانی شامل', reminderDeleted: 'یاد دہانی حذف', noReminders: 'کوئی یاد دہانی نہیں۔', reminderTime: 'یاد دہانی کا وقت', reminder: 'یاد دہانی', timeToTakeMedicine: 'دوائی لینے کا وقت',
  markAllRead: 'سب پڑھا ہوا', noNotifications: 'ابھی کوئی اطلاع نہیں۔',
  activeRequests: 'فعال درخواستیں', completedRequests: 'مکمل درخواستیں', noRestockRequests: 'کوئی درخواست نہیں۔', activeBookings: 'فعال بکنگ', completedBookings: 'مکمل بکنگ',
  viewLocation: 'مقام دیکھیں', openMap: 'نقشہ میں کھولیں', noLocation: 'مقام نہیں', location: 'مقام', saveLocation: 'میرا مقام محفوظ کریں', locationSaved: 'مقام محفوظ ہو گیا',
  sendOffer: 'آفر بھیجیں', price: 'قیمت', discount: 'رعایت', finalPrice: 'حتمی قیمت', estimatedTime: 'تخمینی وقت', offerSent: 'آفر بھیجا گیا', offersReceived: 'موصول آفرز', newOffer: 'نیا آفر', acceptOffer: 'قبول', rejectOffer: 'مسترد', offerAccepted: 'آفر قبول', offerRejected: 'آفر مسترد', from: 'سے', processing: 'پروسیسنگ', rejected: 'مسترد شدہ', orderTracking: 'ٹریکنگ', statusUpdated: 'حالت اپڈیٹ',
  safe: 'محفوظ', expiring: 'ختم ہونے والا',
};

const te: LanguageLabels = {
  ...en,
  dashboard: 'డ్యాష్‌బోర్డ్', settings: 'సెట్టింగ్‌లు', logout: 'లాగ్ అవుట్', save: 'సేవ్', cancel: 'రద్దు', submit: 'సమర్పించు', loading: 'లోడ్ అవుతోంది...', search: 'శోధన', language: 'భాష', edit: 'సవరించు', delete: 'తొలగించు', active: 'సక్రియం', paused: 'ఆపబడింది', notSet: 'సెట్ చేయలేదు', verified: 'ధృవీకరించబడింది',
  login: 'లాగిన్', register: 'ప్రారంభించండి', signUp: 'సైన్ అప్',
  welcomeBack: 'తిరిగి స్వాగతం', pending: 'పెండింగ్', accepted: 'ఆమోదించబడింది', completed: 'పూర్తయింది', accept: 'ఆమోదించు', reject: 'తిరస్కరించు', fulfill: 'పూర్తి చేయి', fulfilled: 'పూర్తయింది', confirmed: 'నిర్ధారించబడింది',
  medicineReminders: 'మందు రిమైండర్లు', restockRequests: 'రీస్టాక్ అభ్యర్థనలు', bloodTestBookings: 'రక్త పరీక్ష బుకింగ్‌లు', notifications: 'నోటిఫికేషన్లు', profile: 'ప్రొఫైల్', personalInfo: 'వ్యక్తిగత సమాచారం', profileUpdated: 'ప్రొఫైల్ నవీకరించబడింది',
  addReminder: 'రిమైండర్ జోడించండి', reminderAdded: 'రిమైండర్ జోడించబడింది', reminderDeleted: 'రిమైండర్ తొలగించబడింది', noReminders: 'రిమైండర్లు లేవు.', reminderTime: 'రిమైండర్ సమయం', reminder: 'రిమైండర్', timeToTakeMedicine: 'మందు తీసుకునే సమయం',
  markAllRead: 'అన్నీ చదివినట్లు', noNotifications: 'నోటిఫికేషన్లు లేవు.',
  activeRequests: 'సక్రియ అభ్యర్థనలు', completedRequests: 'పూర్తయిన అభ్యర్థనలు', noRestockRequests: 'అభ్యర్థనలు లేవు.', activeBookings: 'సక్రియ బుకింగ్‌లు', completedBookings: 'పూర్తయిన బుకింగ్‌లు',
  viewLocation: 'స్థానం చూడండి', openMap: 'మ్యాప్‌లో తెరవండి', noLocation: 'స్థానం లేదు', location: 'స్థానం', saveLocation: 'నా స్థానం సేవ్ చేయండి', locationSaved: 'స్థానం విజయవంతంగా సేవ్ చేయబడింది',
  sendOffer: 'ఆఫర్ పంపండి', price: 'ధర', discount: 'తగ్గింపు', finalPrice: 'తుది ధర', estimatedTime: 'అంచనా సమయం', offerSent: 'ఆఫర్ పంపబడింది', offersReceived: 'అందుకున్న ఆఫర్లు', newOffer: 'కొత్త ఆఫర్', acceptOffer: 'ఆమోదించు', rejectOffer: 'తిరస్కరించు', offerAccepted: 'ఆఫర్ ఆమోదం', offerRejected: 'ఆఫర్ తిరస్కరణ', from: 'నుండి', processing: 'ప్రాసెసింగ్', rejected: 'తిరస్కరించబడింది', orderTracking: 'ట్రాకింగ్', statusUpdated: 'స్థితి నవీకరణ',
  safe: 'సురక్షితం', expiring: 'గడువు ముగుస్తోంది',
};

const mr: LanguageLabels = {
  ...en,
  dashboard: 'डॅशबोर्ड', settings: 'सेटिंग्ज', logout: 'लॉग आउट', save: 'सेव्ह', cancel: 'रद्द', submit: 'सबमिट', loading: 'लोड होत आहे...', search: 'शोधा', language: 'भाषा', edit: 'संपादित करा', delete: 'हटवा', active: 'सक्रिय', paused: 'थांबवले', notSet: 'सेट नाही', verified: 'सत्यापित',
  login: 'लॉग इन', register: 'सुरू करा', signUp: 'साइन अप',
  welcomeBack: 'परत स्वागत', pending: 'प्रलंबित', accepted: 'स्वीकृत', completed: 'पूर्ण', accept: 'स्वीकारा', reject: 'नाकारा', fulfill: 'पूर्ण करा', fulfilled: 'पूर्ण झाले', confirmed: 'पुष्टी झाली',
  medicineReminders: 'औषध स्मरणपत्रे', restockRequests: 'रीस्टॉक विनंत्या', bloodTestBookings: 'रक्त तपासणी बुकिंग', notifications: 'सूचना', profile: 'प्रोफाइल', personalInfo: 'वैयक्तिक माहिती', profileUpdated: 'प्रोफाइल अद्यतनित',
  addReminder: 'स्मरणपत्र जोडा', reminderAdded: 'स्मरणपत्र जोडले', reminderDeleted: 'स्मरणपत्र हटवले', noReminders: 'कोणतेही स्मरणपत्र नाही.', reminderTime: 'स्मरणपत्र वेळ', reminder: 'स्मरणपत्र', timeToTakeMedicine: 'औषध घेण्याची वेळ',
  markAllRead: 'सर्व वाचलेले', noNotifications: 'सूचना नाहीत.',
  activeRequests: 'सक्रिय विनंत्या', completedRequests: 'पूर्ण विनंत्या', noRestockRequests: 'विनंत्या नाहीत.', activeBookings: 'सक्रिय बुकिंग', completedBookings: 'पूर्ण बुकिंग',
  viewLocation: 'स्थान पहा', openMap: 'नकाशात उघडा', noLocation: 'स्थान नाही', location: 'स्थान', saveLocation: 'माझे स्थान सेव्ह करा', locationSaved: 'स्थान यशस्वीरित्या सेव्ह झाले',
  sendOffer: 'ऑफर पाठवा', price: 'किंमत', discount: 'सूट', finalPrice: 'अंतिम किंमत', estimatedTime: 'अंदाजे वेळ', offerSent: 'ऑफर पाठवले', offersReceived: 'प्राप्त ऑफर', newOffer: 'नवीन ऑफर', acceptOffer: 'स्वीकारा', rejectOffer: 'नाकारा', offerAccepted: 'ऑफर स्वीकृत', offerRejected: 'ऑफर नाकारले', from: 'कडून', processing: 'प्रोसेसिंग', rejected: 'नाकारले', orderTracking: 'ट्रॅकिंग', statusUpdated: 'स्थिती अद्यतनित',
  safe: 'सुरक्षित', expiring: 'संपत आहे',
};

const kn: LanguageLabels = {
  ...en,
  dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು', logout: 'ಲಾಗ್ ಔಟ್', save: 'ಉಳಿಸಿ', cancel: 'ರದ್ದು', submit: 'ಸಲ್ಲಿಸಿ', loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...', search: 'ಹುಡುಕಿ', language: 'ಭಾಷೆ', edit: 'ಸಂಪಾದಿಸಿ', delete: 'ಅಳಿಸಿ', active: 'ಸಕ್ರಿಯ', paused: 'ವಿರಾಮ', notSet: 'ಹೊಂದಿಸಿಲ್ಲ', verified: 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
  login: 'ಲಾಗಿನ್', register: 'ಪ್ರಾರಂಭಿಸಿ', signUp: 'ಸೈನ್ ಅಪ್',
  welcomeBack: 'ಮರಳಿ ಸ್ವಾಗತ', pending: 'ಬಾಕಿ', accepted: 'ಸ್ವೀಕೃತ', completed: 'ಪೂರ್ಣ', accept: 'ಸ್ವೀಕರಿಸಿ', reject: 'ತಿರಸ್ಕರಿಸಿ', fulfill: 'ಪೂರ್ಣಗೊಳಿಸಿ', fulfilled: 'ಪೂರ್ಣವಾಗಿದೆ', confirmed: 'ದೃಢೀಕರಿಸಲಾಗಿದೆ',
  medicineReminders: 'ಔಷಧ ಜ್ಞಾಪನೆಗಳು', restockRequests: 'ರೀಸ್ಟಾಕ್ ವಿನಂತಿಗಳು', bloodTestBookings: 'ರಕ್ತ ಪರೀಕ್ಷೆ ಬುಕಿಂಗ್‌ಗಳು', notifications: 'ಅಧಿಸೂಚನೆಗಳು', profile: 'ಪ್ರೊಫೈಲ್', personalInfo: 'ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ', profileUpdated: 'ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಲಾಗಿದೆ',
  addReminder: 'ಜ್ಞಾಪನೆ ಸೇರಿಸಿ', reminderAdded: 'ಜ್ಞಾಪನೆ ಸೇರಿಸಲಾಗಿದೆ', reminderDeleted: 'ಜ್ಞಾಪನೆ ಅಳಿಸಲಾಗಿದೆ', noReminders: 'ಜ್ಞಾಪನೆಗಳಿಲ್ಲ.', reminderTime: 'ಜ್ಞಾಪನೆ ಸಮಯ', reminder: 'ಜ್ಞಾಪನೆ', timeToTakeMedicine: 'ಔಷಧ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ',
  markAllRead: 'ಎಲ್ಲಾ ಓದಿದ', noNotifications: 'ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ.',
  activeRequests: 'ಸಕ್ರಿಯ ವಿನಂತಿಗಳು', completedRequests: 'ಪೂರ್ಣಗೊಂಡ ವಿನಂತಿಗಳು', noRestockRequests: 'ವಿನಂತಿಗಳಿಲ್ಲ.', activeBookings: 'ಸಕ್ರಿಯ ಬುಕಿಂಗ್‌ಗಳು', completedBookings: 'ಪೂರ್ಣಗೊಂಡ ಬುಕಿಂಗ್‌ಗಳು',
  viewLocation: 'ಸ್ಥಳ ನೋಡಿ', openMap: 'ನಕ್ಷೆಯಲ್ಲಿ ತೆರೆಯಿರಿ', noLocation: 'ಸ್ಥಳ ಇಲ್ಲ', location: 'ಸ್ಥಳ', saveLocation: 'ನನ್ನ ಸ್ಥಳ ಉಳಿಸಿ', locationSaved: 'ಸ್ಥಳ ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ',
  sendOffer: 'ಆಫರ್ ಕಳುಹಿಸಿ', price: 'ಬೆಲೆ', discount: 'ರಿಯಾಯಿತಿ', finalPrice: 'ಅಂತಿಮ ಬೆಲೆ', estimatedTime: 'ಅಂದಾಜು ಸಮಯ', offerSent: 'ಆಫರ್ ಕಳುಹಿಸಲಾಗಿದೆ', offersReceived: 'ಸ್ವೀಕರಿಸಿದ ಆಫರ್‌ಗಳು', newOffer: 'ಹೊಸ ಆಫರ್', acceptOffer: 'ಸ್ವೀಕರಿಸಿ', rejectOffer: 'ತಿರಸ್ಕರಿಸಿ', offerAccepted: 'ಆಫರ್ ಸ್ವೀಕೃತ', offerRejected: 'ಆಫರ್ ತಿರಸ್ಕೃತ', from: 'ಇಂದ', processing: 'ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿ', rejected: 'ತಿರಸ್ಕೃತ', orderTracking: 'ಟ್ರ್ಯಾಕಿಂಗ್', statusUpdated: 'ಸ್ಥಿತಿ ನವೀಕರಣ',
  safe: 'ಸುರಕ್ಷಿತ', expiring: 'ಮುಕ್ತಾಯ ಹತ್ತಿರ',
};

const translations: Record<Language, LanguageLabels> = { en, hi, ur, te, mr, kn };

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

const defaultLanguageContext: LanguageContextType = {
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => en[key] || key,
  languageNames,
  allLanguages: Object.keys(translations) as Language[],
};

const LanguageContext = createContext<LanguageContextType>(defaultLanguageContext);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  let authContext: { user: any; profile: any } = { user: null, profile: null };
  try {
    authContext = useAuth();
  } catch {
    // Auth not available yet
  }
  const { user, profile } = authContext;

  useEffect(() => {
    if (profile?.language) {
      const lang = profile.language as Language;
      if (translations[lang]) setLanguageState(lang);
    }
  }, [profile]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
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
  return useContext(LanguageContext);
}
