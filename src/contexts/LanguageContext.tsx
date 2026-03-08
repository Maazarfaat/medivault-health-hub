import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type Language = 'en' | 'hi' | 'ur' | 'te' | 'mr' | 'kn';

interface LanguageLabels {
  [key: string]: string;
}

const en: LanguageLabels = {
  // Common
  dashboard: 'Dashboard', settings: 'Settings', logout: 'Log out', save: 'Save', cancel: 'Cancel', submit: 'Submit', loading: 'Loading...', search: 'Search', actions: 'Actions', status: 'Status', date: 'Date', name: 'Name', email: 'Email', mobile: 'Mobile', language: 'Language',
  // Auth
  login: 'Log in', register: 'Get Started', signUp: 'Sign Up',
  // User Dashboard
  welcomeBack: 'Welcome back', medicineOverview: "Here's your medicine overview", totalMedicines: 'Total Medicines', expiringSoon: 'Expiring Soon', expired: 'Expired', lowStock: 'Low Stock', quickActions: 'Quick Actions', scanQR: 'Scan QR', manualEntry: 'Manual Entry', bookTest: 'Book Test', addMedicine: 'Add Medicine', myMedicines: 'My Medicines', myBloodTestBookings: 'My Blood Test Bookings', noBookingsYet: 'No blood test bookings yet.', noMedicinesYet: 'No medicines added yet. Add your first medicine to start tracking.', restockNow: 'Restock', outOfStock: 'Out of stock', confirmed: 'Your blood test appointment has been confirmed.',
  // Booking
  bookBloodTest: 'Book Blood Test', testType: 'Test Type', selectTestType: 'Select test type', preferredDate: 'Preferred Date', preferredTime: 'Preferred Time', additionalNotes: 'Additional Notes', bookingCreated: 'Blood Test Booking Created Successfully', bookingDesc: 'Your booking request has been sent to diagnostic centres.', bookAppointment: 'Book Appointment', booking: 'Booking...',
  // Medicine
  medicineName: 'Medicine Name', batchNumber: 'Batch Number', expiryDate: 'Expiry Date', quantity: 'Quantity', dosage: 'Dosage', prescribedDoses: 'Prescribed Doses', medicineAdded: 'Medicine Added', addMedicineTitle: 'Add Medicine', qrScan: 'QR Scan', manual: 'Manual', simulateQR: 'Simulate QR Scan', qrScanned: 'QR Scanned', qrDesc: 'Medicine details populated. Review and save.', cameraNotAvailable: 'Camera not available in this environment.', clickSimulate: 'Click below to simulate a scan.',
  // Adherence
  adherence: 'Adherence', takeDose: 'Take Dose', doseTaken: 'Dose Recorded', doseDesc: 'Your adherence has been updated.', adherenceScore: 'Adherence Score',
  // Pharmacy
  pharmacyDashboard: 'Pharmacy Dashboard', manageInventory: 'Manage your inventory and sales', totalItems: 'Total Items', inventoryValue: 'Inventory Value', sellMedicine: 'Sell Medicine', addInventory: 'Add Inventory', csvUpload: 'CSV Upload', restockRequests: 'Restock Requests', pendingRestocks: 'Pending Restock Requests', accept: 'Accept', reject: 'Reject', fulfill: 'Fulfill', inventory: 'Inventory', searchMedicines: 'Search medicines...', addItem: 'Add Item', noInventory: 'No inventory items. Add your first item to get started.', distance: 'Distance', requestAccepted: 'Request accepted', requestRejected: 'Request rejected', requestFulfilled: 'Request fulfilled',
  // Blood Test Centre
  diagnosticDashboard: 'Diagnostic Centre Dashboard', manageBookings: 'Manage blood test bookings', totalBookings: 'Total Bookings', pending: 'Pending', accepted: 'Accepted', completed: 'Completed', bookingRequests: 'Booking Requests', noBookings: 'No bookings yet.', complete: 'Complete', done: 'Done', bookingUpdated: 'Booking Updated', statusChanged: 'Status changed to', userName: 'User Name', testTypeCol: 'Test Type', requestedDate: 'Requested Date', time: 'Time', notes: 'Notes',
  // Hospital
  hospitalDashboard: 'Hospital Dashboard', manageInventoryAdherence: 'Manage inventory and patient adherence', addMedicineScan: 'Add Medicine (Scan/Manual)', medicineInventory: 'Medicine Inventory', noInventoryYet: 'No inventory items yet. Add your first medicine.', patientAdherence: 'Patient Adherence',
  // Location
  locationRequested: 'Location access requested', locationDenied: 'Location access denied. Request will be sent to all providers.', restockSent: 'Restock Request Sent', restockDesc: 'sent to nearby pharmacies.', requestFor: 'Request for', openMap: 'Open in Maps', noLocation: 'No location', location: 'Location', saveLocation: 'Save My Location', locationSaved: 'Location saved successfully',
  // Status
  safe: 'Safe', expiring: 'Expiring',
  // Index
  heroTitle: 'Your Complete Medicine Tracking Platform', heroSubtitle: 'Track medications, manage inventory, book blood tests, and stay on top of your health with MediVault.', getStarted: 'Get Started', learnMore: 'Learn More', features: 'Features', about: 'About', contact: 'Contact',
};

const hi: LanguageLabels = {
  dashboard: '\u0921\u0948\u0936\u092C\u094B\u0930\u094D\u0921', settings: '\u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938', logout: '\u0932\u0949\u0917 \u0906\u0909\u091F', save: '\u0938\u0947\u0935 \u0915\u0930\u0947\u0902', cancel: '\u0930\u0926\u094D\u0926 \u0915\u0930\u0947\u0902', submit: '\u091C\u092E\u093E \u0915\u0930\u0947\u0902', loading: '\u0932\u094B\u0921 \u0939\u094B \u0930\u0939\u093E \u0939\u0948...', search: '\u0916\u094B\u091C\u0947\u0902', actions: '\u0915\u093E\u0930\u094D\u092F', status: '\u0938\u094D\u0925\u093F\u0924\u093F', date: '\u0924\u093E\u0930\u0940\u0916', name: '\u0928\u093E\u092E', email: '\u0908\u092E\u0947\u0932', mobile: '\u092E\u094B\u092C\u093E\u0907\u0932', language: '\u092D\u093E\u0937\u093E',
  login: '\u0932\u0949\u0917 \u0907\u0928', register: '\u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902', signUp: '\u0938\u093E\u0907\u0928 \u0905\u092A',
  welcomeBack: '\u0935\u093E\u092A\u0938 \u0938\u094D\u0935\u093E\u0917\u0924 \u0939\u0948', medicineOverview: '\u0906\u092A\u0915\u0940 \u0926\u0935\u093E\u0907\u092F\u094B\u0902 \u0915\u093E \u0905\u0935\u0932\u094B\u0915\u0928', totalMedicines: '\u0915\u0941\u0932 \u0926\u0935\u093E\u0907\u092F\u093E\u0902', expiringSoon: '\u091C\u0932\u094D\u0926\u0940 \u0938\u092E\u093E\u092A\u094D\u0924', expired: '\u0938\u092E\u093E\u092A\u094D\u0924', lowStock: '\u0915\u092E \u0938\u094D\u091F\u0949\u0915', quickActions: '\u0924\u094D\u0935\u0930\u093F\u0924 \u0915\u093E\u0930\u094D\u092F', scanQR: 'QR \u0938\u094D\u0915\u0948\u0928', manualEntry: '\u092E\u0948\u0928\u094D\u092F\u0941\u0905\u0932 \u090F\u0902\u091F\u094D\u0930\u0940', bookTest: '\u091F\u0947\u0938\u094D\u091F \u092C\u0941\u0915 \u0915\u0930\u0947\u0902', addMedicine: '\u0926\u0935\u093E \u091C\u094B\u0921\u093C\u0947\u0902', myMedicines: '\u092E\u0947\u0930\u0940 \u0926\u0935\u093E\u0907\u092F\u093E\u0902', myBloodTestBookings: '\u092E\u0947\u0930\u0940 \u0930\u0915\u094D\u0924 \u092A\u0930\u0940\u0915\u094D\u0937\u0923 \u092C\u0941\u0915\u093F\u0902\u0917', noBookingsYet: '\u0905\u092D\u0940 \u0924\u0915 \u0915\u094B\u0908 \u092C\u0941\u0915\u093F\u0902\u0917 \u0928\u0939\u0940\u0902\u0964', noMedicinesYet: '\u0905\u092D\u0940 \u0924\u0915 \u0915\u094B\u0908 \u0926\u0935\u093E \u0928\u0939\u0940\u0902 \u091C\u094B\u0921\u093C\u0940 \u0917\u0908\u0964', restockNow: '\u0930\u0940\u0938\u094D\u091F\u0949\u0915', outOfStock: '\u0938\u094D\u091F\u0949\u0915 \u0916\u0924\u094D\u092E', confirmed: '\u0906\u092A\u0915\u0940 \u0930\u0915\u094D\u0924 \u092A\u0930\u0940\u0915\u094D\u0937\u0923 \u0905\u092A\u0949\u0907\u0902\u091F\u092E\u0947\u0902\u091F \u0915\u0940 \u092A\u0941\u0937\u094D\u091F\u093F \u0939\u094B \u0917\u0908 \u0939\u0948\u0964',
  bookBloodTest: '\u0930\u0915\u094D\u0924 \u092A\u0930\u0940\u0915\u094D\u0937\u0923 \u092C\u0941\u0915 \u0915\u0930\u0947\u0902', testType: '\u092A\u0930\u0940\u0915\u094D\u0937\u0923 \u092A\u094D\u0930\u0915\u093E\u0930', selectTestType: '\u092A\u0930\u0940\u0915\u094D\u0937\u0923 \u092A\u094D\u0930\u0915\u093E\u0930 \u091A\u0941\u0928\u0947\u0902', preferredDate: '\u092A\u0938\u0902\u0926\u0940\u0926\u093E \u0924\u093E\u0930\u0940\u0916', preferredTime: '\u092A\u0938\u0902\u0926\u0940\u0926\u093E \u0938\u092E\u092F', additionalNotes: '\u0905\u0924\u093F\u0930\u093F\u0915\u094D\u0924 \u0928\u094B\u091F\u094D\u0938', bookingCreated: '\u0930\u0915\u094D\u0924 \u092A\u0930\u0940\u0915\u094D\u0937\u0923 \u092C\u0941\u0915\u093F\u0902\u0917 \u0938\u092B\u0932', bookingDesc: '\u0906\u092A\u0915\u093E \u0905\u0928\u0941\u0930\u094B\u0927 \u0921\u093E\u092F\u0917\u094D\u0928\u094B\u0938\u094D\u091F\u093F\u0915 \u0938\u0947\u0902\u091F\u0930\u094B\u0902 \u0915\u094B \u092D\u0947\u091C\u093E \u0917\u092F\u093E\u0964', bookAppointment: '\u0905\u092A\u0949\u0907\u0902\u091F\u092E\u0947\u0902\u091F \u092C\u0941\u0915 \u0915\u0930\u0947\u0902', booking: '\u092C\u0941\u0915 \u0939\u094B \u0930\u0939\u093E \u0939\u0948...',
  medicineName: '\u0926\u0935\u093E \u0915\u093E \u0928\u093E\u092E', batchNumber: '\u092C\u0948\u091A \u0928\u0902\u092C\u0930', expiryDate: '\u0938\u092E\u093E\u092A\u094D\u0924\u093F \u0924\u093F\u0925\u093F', quantity: '\u092E\u093E\u0924\u094D\u0930\u093E', dosage: '\u0916\u0941\u0930\u093E\u0915', prescribedDoses: '\u0928\u093F\u0930\u094D\u0927\u093E\u0930\u093F\u0924 \u0916\u0941\u0930\u093E\u0915', medicineAdded: '\u0926\u0935\u093E \u091C\u094B\u0921\u093C\u0940 \u0917\u0908', addMedicineTitle: '\u0926\u0935\u093E \u091C\u094B\u0921\u093C\u0947\u0902', qrScan: 'QR \u0938\u094D\u0915\u0948\u0928', manual: '\u092E\u0948\u0928\u094D\u092F\u0941\u0905\u0932', simulateQR: 'QR \u0938\u094D\u0915\u0948\u0928 \u0938\u093F\u092E\u0941\u0932\u0947\u091F \u0915\u0930\u0947\u0902', qrScanned: 'QR \u0938\u094D\u0915\u0948\u0928 \u0939\u0941\u0906', qrDesc: '\u0926\u0935\u093E \u0935\u093F\u0935\u0930\u0923 \u092D\u0930\u0947 \u0917\u090F\u0964 \u0938\u092E\u0940\u0915\u094D\u0937\u093E \u0915\u0930\u0947\u0902 \u0914\u0930 \u0938\u0947\u0935 \u0915\u0930\u0947\u0902\u0964', cameraNotAvailable: '\u0915\u0948\u092E\u0930\u093E \u0909\u092A\u0932\u092C\u094D\u0927 \u0928\u0939\u0940\u0902\u0964', clickSimulate: '\u0938\u093F\u092E\u0941\u0932\u0947\u091F \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0928\u0940\u091A\u0947 \u0915\u094D\u0932\u093F\u0915 \u0915\u0930\u0947\u0902\u0964',
  adherence: '\u092A\u093E\u0932\u0928', takeDose: '\u0916\u0941\u0930\u093E\u0915 \u0932\u0947\u0902', doseTaken: '\u0916\u0941\u0930\u093E\u0915 \u0926\u0930\u094D\u091C', doseDesc: '\u0906\u092A\u0915\u093E \u092A\u093E\u0932\u0928 \u0905\u092A\u0921\u0947\u091F \u0915\u093F\u092F\u093E \u0917\u092F\u093E\u0964', adherenceScore: '\u092A\u093E\u0932\u0928 \u0938\u094D\u0915\u094B\u0930',
  pharmacyDashboard: '\u092B\u093E\u0930\u094D\u092E\u0947\u0938\u0940 \u0921\u0948\u0936\u092C\u094B\u0930\u094D\u0921', manageInventory: '\u0905\u092A\u0928\u0940 \u0907\u0928\u094D\u0935\u0947\u0902\u091F\u094D\u0930\u0940 \u0914\u0930 \u092C\u093F\u0915\u094D\u0930\u0940 \u092A\u094D\u0930\u092C\u0902\u0927\u093F\u0924 \u0915\u0930\u0947\u0902', totalItems: '\u0915\u0941\u0932 \u0906\u0907\u091F\u092E', inventoryValue: '\u0907\u0928\u094D\u0935\u0947\u0902\u091F\u094D\u0930\u0940 \u092E\u0942\u0932\u094D\u092F', sellMedicine: '\u0926\u0935\u093E \u092C\u0947\u091A\u0947\u0902', addInventory: '\u0907\u0928\u094D\u0935\u0947\u0902\u091F\u094D\u0930\u0940 \u091C\u094B\u0921\u093C\u0947\u0902', csvUpload: 'CSV \u0905\u092A\u0932\u094B\u0921', restockRequests: '\u0930\u0940\u0938\u094D\u091F\u0949\u0915 \u0905\u0928\u0941\u0930\u094B\u0927', pendingRestocks: '\u0932\u0902\u092C\u093F\u0924 \u0930\u0940\u0938\u094D\u091F\u0949\u0915 \u0905\u0928\u0941\u0930\u094B\u0927', accept: '\u0938\u094D\u0935\u0940\u0915\u093E\u0930', reject: '\u0905\u0938\u094D\u0935\u0940\u0915\u093E\u0930', fulfill: '\u092A\u0942\u0930\u093E \u0915\u0930\u0947\u0902', inventory: '\u0907\u0928\u094D\u0935\u0947\u0902\u091F\u094D\u0930\u0940', searchMedicines: '\u0926\u0935\u093E\u0907\u092F\u093E\u0902 \u0916\u094B\u091C\u0947\u0902...', addItem: '\u0906\u0907\u091F\u092E \u091C\u094B\u0921\u093C\u0947\u0902', noInventory: '\u0915\u094B\u0908 \u0907\u0928\u094D\u0935\u0947\u0902\u091F\u094D\u0930\u0940 \u0928\u0939\u0940\u0902\u0964', distance: '\u0926\u0942\u0930\u0940', requestAccepted: '\u0905\u0928\u0941\u0930\u094B\u0927 \u0938\u094D\u0935\u0940\u0915\u0943\u0924', requestRejected: '\u0905\u0928\u0941\u0930\u094B\u0927 \u0905\u0938\u094D\u0935\u0940\u0915\u0943\u0924', requestFulfilled: '\u0905\u0928\u0941\u0930\u094B\u0927 \u092A\u0942\u0930\u093E',
  diagnosticDashboard: '\u0921\u093E\u092F\u0917\u094D\u0928\u094B\u0938\u094D\u091F\u093F\u0915 \u0938\u0947\u0902\u091F\u0930 \u0921\u0948\u0936\u092C\u094B\u0930\u094D\u0921', manageBookings: '\u0930\u0915\u094D\u0924 \u092A\u0930\u0940\u0915\u094D\u0937\u0923 \u092C\u0941\u0915\u093F\u0902\u0917 \u092A\u094D\u0930\u092C\u0902\u0927\u093F\u0924 \u0915\u0930\u0947\u0902', totalBookings: '\u0915\u0941\u0932 \u092C\u0941\u0915\u093F\u0902\u0917', pending: '\u0932\u0902\u092C\u093F\u0924', accepted: '\u0938\u094D\u0935\u0940\u0915\u0943\u0924', completed: '\u092A\u0942\u0930\u094D\u0923', bookingRequests: '\u092C\u0941\u0915\u093F\u0902\u0917 \u0905\u0928\u0941\u0930\u094B\u0927', noBookings: '\u0905\u092D\u0940 \u0924\u0915 \u0915\u094B\u0908 \u092C\u0941\u0915\u093F\u0902\u0917 \u0928\u0939\u0940\u0902\u0964', complete: '\u092A\u0942\u0930\u093E \u0915\u0930\u0947\u0902', done: '\u0939\u094B \u0917\u092F\u093E', bookingUpdated: '\u092C\u0941\u0915\u093F\u0902\u0917 \u0905\u092A\u0921\u0947\u091F', statusChanged: '\u0938\u094D\u0925\u093F\u0924\u093F \u092C\u0926\u0932\u0940', userName: '\u0909\u092A\u092F\u094B\u0917\u0915\u0930\u094D\u0924\u093E \u0928\u093E\u092E', testTypeCol: '\u092A\u0930\u0940\u0915\u094D\u0937\u0923 \u092A\u094D\u0930\u0915\u093E\u0930', requestedDate: '\u0905\u0928\u0941\u0930\u094B\u0927\u093F\u0924 \u0924\u093E\u0930\u0940\u0916', time: '\u0938\u092E\u092F', notes: '\u0928\u094B\u091F\u094D\u0938',
  hospitalDashboard: '\u0905\u0938\u094D\u092A\u0924\u093E\u0932 \u0921\u0948\u0936\u092C\u094B\u0930\u094D\u0921', manageInventoryAdherence: '\u0907\u0928\u094D\u0935\u0947\u0902\u091F\u094D\u0930\u0940 \u0914\u0930 \u092E\u0930\u0940\u091C \u092A\u093E\u0932\u0928 \u092A\u094D\u0930\u092C\u0902\u0927\u093F\u0924 \u0915\u0930\u0947\u0902', addMedicineScan: '\u0926\u0935\u093E \u091C\u094B\u0921\u093C\u0947\u0902 (\u0938\u094D\u0915\u0948\u0928/\u092E\u0948\u0928\u094D\u092F\u0941\u0905\u0932)', medicineInventory: '\u0926\u0935\u093E \u0907\u0928\u094D\u0935\u0947\u0902\u091F\u094D\u0930\u0940', noInventoryYet: '\u0905\u092D\u0940 \u0924\u0915 \u0915\u094B\u0908 \u0907\u0928\u094D\u0935\u0947\u0902\u091F\u094D\u0930\u0940 \u0928\u0939\u0940\u0902\u0964', patientAdherence: '\u092E\u0930\u0940\u091C \u092A\u093E\u0932\u0928',
  locationRequested: '\u0938\u094D\u0925\u093E\u0928 \u0905\u0928\u0941\u092E\u0924\u093F \u092E\u093E\u0902\u0917\u0940', locationDenied: '\u0938\u094D\u0925\u093E\u0928 \u0905\u0928\u0941\u092E\u0924\u093F \u0905\u0938\u094D\u0935\u0940\u0915\u0943\u0924\u0964', restockSent: '\u0930\u0940\u0938\u094D\u091F\u0949\u0915 \u0905\u0928\u0941\u0930\u094B\u0927 \u092D\u0947\u091C\u093E', restockDesc: '\u0928\u093F\u0915\u091F\u0924\u092E \u092B\u093E\u0930\u094D\u092E\u0947\u0938\u093F\u092F\u094B\u0902 \u0915\u094B \u092D\u0947\u091C\u093E \u0917\u092F\u093E\u0964', requestFor: '\u0905\u0928\u0941\u0930\u094B\u0927', openMap: '\u092E\u093E\u0928\u091A\u093F\u0924\u094D\u0930 \u092E\u0947\u0902 \u0916\u094B\u0932\u0947\u0902', noLocation: '\u0938\u094D\u0925\u093E\u0928 \u0928\u0939\u0940\u0902', location: '\u0938\u094D\u0925\u093E\u0928', saveLocation: '\u092E\u0947\u0930\u093E \u0938\u094D\u0925\u093E\u0928 \u0938\u0947\u0935 \u0915\u0930\u0947\u0902', locationSaved: '\u0938\u094D\u0925\u093E\u0928 \u0938\u092B\u0932\u0924\u093E\u092A\u0942\u0930\u094D\u0935\u0915 \u0938\u0947\u0935 \u0915\u093F\u092F\u093E \u0917\u092F\u093E',
  safe: '\u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924', expiring: '\u0938\u092E\u093E\u092A\u094D\u0924 \u0939\u094B\u0928\u0947 \u0935\u093E\u0932\u093E',
  heroTitle: '\u0906\u092A\u0915\u093E \u0938\u0902\u092A\u0942\u0930\u094D\u0923 \u0926\u0935\u093E \u091F\u094D\u0930\u0948\u0915\u093F\u0902\u0917 \u092A\u094D\u0932\u0947\u091F\u092B\u093C\u0949\u0930\u094D\u092E', heroSubtitle: 'MediVault \u0915\u0947 \u0938\u093E\u0925 \u0926\u0935\u093E\u0907\u092F\u094B\u0902 \u0915\u094B \u091F\u094D\u0930\u0948\u0915 \u0915\u0930\u0947\u0902\u0964', getStarted: '\u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902', learnMore: '\u0914\u0930 \u091C\u093E\u0928\u0947\u0902', features: '\u0938\u0941\u0935\u093F\u0927\u093E\u090F\u0902', about: '\u092A\u0930\u093F\u091A\u092F', contact: '\u0938\u0902\u092A\u0930\u094D\u0915',
};

// For non-Latin scripts, use English fallback for missing keys via the t() function
const ur: LanguageLabels = {
  ...en,
  dashboard: '\u0688\u06CC\u0634 \u0628\u0648\u0631\u0688', settings: '\u062A\u0631\u062A\u06CC\u0628\u0627\u062A', logout: '\u0644\u0627\u06AF \u0622\u0624\u0679', save: '\u0645\u062D\u0641\u0648\u0638 \u06A9\u0631\u06CC\u06BA', cancel: '\u0645\u0646\u0633\u0648\u062E', submit: '\u062C\u0645\u0639 \u06A9\u0631\u06CC\u06BA', loading: '\u0644\u0648\u0688 \u06C1\u0648 \u0631\u06C1\u0627 \u06C1\u06D2...', search: '\u062A\u0644\u0627\u0634', language: '\u0632\u0628\u0627\u0646',
  login: '\u0644\u0627\u06AF \u0627\u0646', register: '\u0634\u0631\u0648\u0639 \u06A9\u0631\u06CC\u06BA', signUp: '\u0633\u0627\u0626\u0646 \u0627\u067E',
  welcomeBack: '\u0648\u0627\u067E\u0633\u06CC \u067E\u0631 \u062E\u0648\u0634 \u0622\u0645\u062F\u06CC\u062F', pending: '\u0632\u06CC\u0631 \u0627\u0644\u062A\u0648\u0627', accepted: '\u0642\u0628\u0648\u0644 \u0634\u062F\u06C1', completed: '\u0645\u06A9\u0645\u0644', accept: '\u0642\u0628\u0648\u0644', reject: '\u0645\u0633\u062A\u0631\u062F', fulfill: '\u067E\u0648\u0631\u0627 \u06A9\u0631\u06CC\u06BA',
  openMap: '\u0646\u0642\u0634\u0647 \u0645\u06CC\u06BA \u06A9\u06BE\u0648\u0644\u06CC\u06BA', noLocation: '\u0645\u0642\u0627\u0645 \u0646\u06C1\u06CC\u06BA', location: '\u0645\u0642\u0627\u0645', saveLocation: '\u0645\u06CC\u0631\u0627 \u0645\u0642\u0627\u0645 \u0645\u062D\u0641\u0648\u0638 \u06A9\u0631\u06CC\u06BA', locationSaved: '\u0645\u0642\u0627\u0645 \u0645\u062D\u0641\u0648\u0638 \u06C1\u0648 \u06AF\u06CC\u0627',
  safe: '\u0645\u062D\u0641\u0648\u0638', expiring: '\u062E\u062A\u0645 \u06C1\u0648\u0646\u0647 \u0648\u0627\u0644\u0627',
};

const te: LanguageLabels = {
  ...en,
  dashboard: '\u0C21\u0C4D\u0C2F\u0C3E\u0C37\u0C4D\u200C\u0C2C\u0C4B\u0C30\u0C4D\u0C21\u0C4D', settings: '\u0C38\u0C46\u0C1F\u0C4D\u0C1F\u0C3F\u0C02\u0C17\u0C4D\u200C\u0C32\u0C41', logout: '\u0C32\u0C3E\u0C17\u0C4D \u0C05\u0C35\u0C41\u0C1F\u0C4D', save: '\u0C38\u0C47\u0C35\u0C4D', cancel: '\u0C30\u0C26\u0C4D\u0C26\u0C41', submit: '\u0C38\u0C2E\u0C30\u0C4D\u0C2A\u0C3F\u0C02\u0C1A\u0C41', loading: '\u0C32\u0C4B\u0C21\u0C4D \u0C05\u0C35\u0C41\u0C24\u0C4B\u0C02\u0C26\u0C3F...', search: '\u0C36\u0C4B\u0C27\u0C28', language: '\u0C2D\u0C3E\u0C37',
  login: '\u0C32\u0C3E\u0C17\u0C3F\u0C28\u0C4D', register: '\u0C2A\u0C4D\u0C30\u0C3E\u0C30\u0C02\u0C2D\u0C3F\u0C02\u0C1A\u0C02\u0C21\u0C3F', signUp: '\u0C38\u0C48\u0C28\u0C4D \u0C05\u0C2A\u0C4D',
  welcomeBack: '\u0C24\u0C3F\u0C30\u0C3F\u0C17\u0C3F \u0C38\u0C4D\u0C35\u0C3E\u0C17\u0C24\u0C02', pending: '\u0C2A\u0C46\u0C02\u0C21\u0C3F\u0C02\u0C17\u0C4D', accepted: '\u0C06\u0C2E\u0C4B\u0C26\u0C3F\u0C02\u0C1A\u0C2C\u0C21\u0C3F\u0C02\u0C26\u0C3F', completed: '\u0C2A\u0C42\u0C30\u0C4D\u0C24\u0C2F\u0C3F\u0C02\u0C26\u0C3F', accept: '\u0C06\u0C2E\u0C4B\u0C26\u0C3F\u0C02\u0C1A\u0C41', reject: '\u0C24\u0C3F\u0C30\u0C38\u0C4D\u0C15\u0C30\u0C3F\u0C02\u0C1A\u0C41', fulfill: '\u0C2A\u0C42\u0C30\u0C4D\u0C24\u0C3F \u0C1A\u0C47\u0C2F\u0C3F',
  openMap: '\u0C2E\u0C4D\u0C2F\u0C3E\u0C2A\u0C4D\u200C\u0C32\u0C4B \u0C24\u0C46\u0C30\u0C35\u0C02\u0C21\u0C3F', noLocation: '\u0C38\u0C4D\u0C25\u0C3E\u0C28\u0C02 \u0C32\u0C47\u0C26\u0C41', location: '\u0C38\u0C4D\u0C25\u0C3E\u0C28\u0C02', saveLocation: '\u0C28\u0C3E \u0C38\u0C4D\u0C25\u0C3E\u0C28\u0C02 \u0C38\u0C47\u0C35\u0C4D \u0C1A\u0C47\u0C2F\u0C02\u0C21\u0C3F', locationSaved: '\u0C38\u0C4D\u0C25\u0C3E\u0C28\u0C02 \u0C35\u0C3F\u0C1C\u0C2F\u0C35\u0C02\u0C24\u0C02\u0C17\u0C3E \u0C38\u0C47\u0C35\u0C4D \u0C1A\u0C47\u0C2F\u0C2C\u0C21\u0C3F\u0C02\u0C26\u0C3F',
  safe: '\u0C38\u0C41\u0C30\u0C15\u0C4D\u0C37\u0C3F\u0C24\u0C02', expiring: '\u0C17\u0C21\u0C41\u0C35\u0C41 \u0C2E\u0C41\u0C17\u0C41\u0C38\u0C4D\u0C24\u0C4B\u0C02\u0C26\u0C3F',
};

const mr: LanguageLabels = {
  ...en,
  dashboard: '\u0921\u0945\u0936\u092C\u094B\u0930\u094D\u0921', settings: '\u0938\u0947\u091F\u093F\u0902\u0917\u094D\u091C', logout: '\u0932\u0949\u0917 \u0906\u0909\u091F', save: '\u0938\u0947\u0935\u094D\u0939', cancel: '\u0930\u0926\u094D\u0926', submit: '\u0938\u092C\u092E\u093F\u091F', loading: '\u0932\u094B\u0921 \u0939\u094B\u0924 \u0906\u0939\u0947...', search: '\u0936\u094B\u0927\u093E', language: '\u092D\u093E\u0937\u093E',
  login: '\u0932\u0949\u0917 \u0907\u0928', register: '\u0938\u0941\u0930\u0942 \u0915\u0930\u093E', signUp: '\u0938\u093E\u0907\u0928 \u0905\u092A',
  welcomeBack: '\u092A\u0930\u0924 \u0938\u094D\u0935\u093E\u0917\u0924', pending: '\u092A\u094D\u0930\u0932\u0902\u092C\u093F\u0924', accepted: '\u0938\u094D\u0935\u0940\u0915\u0943\u0924', completed: '\u092A\u0942\u0930\u094D\u0923', accept: '\u0938\u094D\u0935\u0940\u0915\u093E\u0930\u093E', reject: '\u0928\u093E\u0915\u093E\u0930\u093E', fulfill: '\u092A\u0942\u0930\u094D\u0923 \u0915\u0930\u093E',
  openMap: '\u0928\u0915\u093E\u0936\u093E\u0924 \u0909\u0918\u0921\u093E', noLocation: '\u0938\u094D\u0925\u093E\u0928 \u0928\u093E\u0939\u0940', location: '\u0938\u094D\u0925\u093E\u0928', saveLocation: '\u092E\u093E\u091D\u0947 \u0938\u094D\u0925\u093E\u0928 \u0938\u0947\u0935\u094D\u0939 \u0915\u0930\u093E', locationSaved: '\u0938\u094D\u0925\u093E\u0928 \u092F\u0936\u0938\u094D\u0935\u0940\u0930\u0940\u0924\u094D\u092F\u093E \u0938\u0947\u0935\u094D\u0939 \u091D\u093E\u0932\u0947',
  safe: '\u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924', expiring: '\u0938\u0902\u092A\u0924 \u0906\u0939\u0947',
};

const kn: LanguageLabels = {
  ...en,
  dashboard: '\u0CA1\u0CCD\u0CAF\u0CBE\u0CB6\u0CCD\u200C\u0CAC\u0CCB\u0CB0\u0CCD\u0CA1\u0CCD', settings: '\u0CB8\u0CC6\u0C9F\u0CCD\u0C9F\u0CBF\u0C82\u0C97\u0CCD\u200C\u0C97\u0CB3\u0CC1', logout: '\u0CB2\u0CBE\u0C97\u0CCD \u0C94\u0C9F\u0CCD', save: '\u0C89\u0CB3\u0CBF\u0CB8\u0CBF', cancel: '\u0CB0\u0CA6\u0CCD\u0CA6\u0CC1', submit: '\u0CB8\u0CB2\u0CCD\u0CB2\u0CBF\u0CB8\u0CBF', loading: '\u0CB2\u0CCB\u0CA1\u0CCD \u0C86\u0C97\u0CC1\u0CA4\u0CCD\u0CA4\u0CBF\u0CA6\u0CC6...', search: '\u0CB9\u0CC1\u0CA1\u0CC1\u0C95\u0CBF', language: '\u0CAD\u0CBE\u0CB7\u0CC6',
  login: '\u0CB2\u0CBE\u0C97\u0CBF\u0CA8\u0CCD', register: '\u0CAA\u0CCD\u0CB0\u0CBE\u0CB0\u0C82\u0CAD\u0CBF\u0CB8\u0CBF', signUp: '\u0CB8\u0CC8\u0CA8\u0CCD \u0C85\u0CAA\u0CCD',
  welcomeBack: '\u0CAE\u0CB0\u0CB3\u0CBF \u0CB8\u0CCD\u0CB5\u0CBE\u0C97\u0CA4', pending: '\u0CAC\u0CBE\u0C95\u0CBF', accepted: '\u0CB8\u0CCD\u0CB5\u0CC0\u0C95\u0CC3\u0CA4', completed: '\u0CAA\u0CC2\u0CB0\u0CCD\u0CA3', accept: '\u0CB8\u0CCD\u0CB5\u0CC0\u0C95\u0CB0\u0CBF\u0CB8\u0CBF', reject: '\u0CA4\u0CBF\u0CB0\u0CB8\u0CCD\u0C95\u0CB0\u0CBF\u0CB8\u0CBF', fulfill: '\u0CAA\u0CC2\u0CB0\u0CCD\u0CA3\u0C97\u0CCA\u0CB3\u0CBF\u0CB8\u0CBF',
  openMap: '\u0CA8\u0C95\u0CCD\u0CB7\u0CC6\u0CAF\u0CB2\u0CCD\u0CB2\u0CBF \u0CA4\u0CC6\u0CB0\u0CC6\u0CAF\u0CBF\u0CB0\u0CBF', noLocation: '\u0CB8\u0CCD\u0CA5\u0CB3 \u0C87\u0CB2\u0CCD\u0CB2', location: '\u0CB8\u0CCD\u0CA5\u0CB3', saveLocation: '\u0CA8\u0CA8\u0CCD\u0CA8 \u0CB8\u0CCD\u0CA5\u0CB3 \u0C89\u0CB3\u0CBF\u0CB8\u0CBF', locationSaved: '\u0CB8\u0CCD\u0CA5\u0CB3 \u0CAF\u0CB6\u0CB8\u0CCD\u0CB5\u0CBF\u0CAF\u0CBE\u0C97\u0CBF \u0C89\u0CB3\u0CBF\u0CB8\u0CB2\u0CBE\u0C97\u0CBF\u0CA6\u0CC6',
  safe: '\u0CB8\u0CC1\u0CB0\u0C95\u0CCD\u0CB7\u0CBF\u0CA4', expiring: '\u0CAE\u0CC1\u0C95\u0CCD\u0CA4\u0CBE\u0CAF \u0CB9\u0CA4\u0CCD\u0CA4\u0CBF\u0CB0',
};

const translations: Record<Language, LanguageLabels> = { en, hi, ur, te, mr, kn };

const languageNames: Record<Language, string> = {
  en: 'English',
  hi: '\u0939\u093F\u0902\u0926\u0940',
  ur: '\u0627\u0631\u062F\u0648',
  te: '\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41',
  mr: '\u092E\u0930\u093E\u0920\u0940',
  kn: '\u0C95\u0CA8\u0CCD\u0CA8\u0CA1',
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
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
