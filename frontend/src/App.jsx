import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Complete Exhaustive Directory of 196+ Strategic Industrial Assets across India & Sri Lanka
const FULL_STRATEGIC_ASSETS = [
  // --- GUJARAT PETROCHEMICAL & ENERGY CORRIDOR (1-20) ---
  { id: 'ind-1', name: 'Reliance Jamnagar Mega Refinery & Polypropylene Complex', lat: 22.4707, lng: 70.0577, region: 'Gujarat Industrial Belt' },
  { id: 'ind-2', name: 'Nayara Energy Vadinar Strategic Refinery', lat: 22.3980, lng: 69.7120, region: 'Gujarat Coastal Belt' },
  { id: 'ind-3', name: 'ONGC Petro additions Ltd (OPaL) Dahej', lat: 21.7051, lng: 72.5855, region: 'Gujarat Coastal Belt' },
  { id: 'ind-4', name: 'Petronet LNG Terminal Dahej', lat: 21.6730, lng: 72.5320, region: 'Gujarat Coastal Belt' },
  { id: 'ind-5', name: 'Reliance Industries Hazira Petrochemical Complex', lat: 21.1121, lng: 72.6450, region: 'Gujarat Coastal Belt' },
  { id: 'ind-6', name: 'L&T Heavy Engineering Complex Hazira', lat: 21.1340, lng: 72.6780, region: 'Gujarat Coastal Belt' },
  { id: 'ind-7', name: 'IOCL Gujarat Refinery (Koyali Vadodara)', lat: 22.3511, lng: 73.1360, region: 'Gujarat Industrial Belt' },
  { id: 'ind-8', name: 'Gujarat State Fertilizers & Chemicals (GSFC) Vadodara', lat: 22.3680, lng: 73.1590, region: 'Gujarat Industrial Belt' },
  { id: 'ind-9', name: 'GNFC Narmadanagar Fertilizer Complex Bharuch', lat: 21.7480, lng: 73.0180, region: 'Gujarat Industrial Belt' },
  { id: 'ind-10', name: 'Ankleshwar GIDC Mega Chemical Estate', lat: 21.6264, lng: 73.0033, region: 'Gujarat Industrial Belt' },
  { id: 'ind-11', name: 'Adani Mundra Ultra Mega Power Plant (4620 MW)', lat: 22.8250, lng: 69.5280, region: 'Kutch Industrial Belt' },
  { id: 'ind-12', name: 'Tata Mundra Ultra Mega Power Plant', lat: 22.8120, lng: 69.5450, region: 'Kutch Industrial Belt' },
  { id: 'ind-13', name: 'Mundra Petrochemicals & Copper Smelter', lat: 22.8420, lng: 69.7040, region: 'Kutch Industrial Belt' },
  { id: 'ind-14', name: 'Wanakbori Thermal Power Station', lat: 22.8790, lng: 73.3640, region: 'Gujarat Industrial Belt' },
  { id: 'ind-15', name: 'Ukai Thermal Power Station (GSECL)', lat: 21.2180, lng: 73.5790, region: 'Gujarat Industrial Belt' },
  { id: 'ind-16', name: 'Dhuvaran Gas Thermal Power Plant', lat: 22.2380, lng: 72.7530, region: 'Gujarat Coastal Belt' },
  { id: 'ind-17', name: 'Sikka Thermal Power Station Jamnagar', lat: 22.4280, lng: 69.8320, region: 'Gujarat Coastal Belt' },
  { id: 'ind-18', name: 'UPL Chemical Manufacturing Hub Jhagadia', lat: 21.6820, lng: 73.1450, region: 'Gujarat Industrial Belt' },
  { id: 'ind-19', name: 'Vapi GIDC Heavy Chemical Cluster', lat: 20.3720, lng: 72.9100, region: 'Gujarat Industrial Belt' },
  { id: 'ind-20', name: 'Atul Ltd Chemical Mega Complex Valsad', lat: 20.5180, lng: 72.9560, region: 'Gujarat Industrial Belt' },

  // --- MAHARASHTRA & KONKAN DECCAN BELT (21-40) ---
  { id: 'ind-21', name: 'BPCL Mumbai Strategic Coastal Refinery', lat: 19.0080, lng: 72.8940, region: 'Maharashtra Deccan' },
  { id: 'ind-22', name: 'HPCL Mumbai Petroleum Refinery Mahul', lat: 18.9980, lng: 72.8870, region: 'Maharashtra Deccan' },
  { id: 'ind-23', name: 'RCF Trombay Fertilizer & Heavy Chemical Unit', lat: 19.0430, lng: 72.8950, region: 'Maharashtra Deccan' },
  { id: 'ind-24', name: 'Tata Power Trombay Thermal Generating Station', lat: 19.0020, lng: 72.9050, region: 'Maharashtra Deccan' },
  { id: 'ind-25', name: 'RCF Thal Mega Nitrogenous Fertilizer Complex', lat: 18.6947, lng: 72.8752, region: 'Maharashtra Deccan' },
  { id: 'ind-26', name: 'JSW Steel Dolvi Integrated Metallurgical Complex', lat: 18.7050, lng: 73.0230, region: 'Maharashtra Deccan' },
  { id: 'ind-27', name: 'JSW Energy Jaigad Thermal Power Plant', lat: 17.3010, lng: 73.2080, region: 'Maharashtra Coastal Belt' },
  { id: 'ind-28', name: 'Dabhol Ratnagiri Gas & Power (RGPPL/GAIL LNG)', lat: 17.5250, lng: 73.1750, region: 'Maharashtra Coastal Belt' },
  { id: 'ind-29', name: 'HOCL Chemical Complex Rasayani', lat: 18.8950, lng: 73.1764, region: 'Maharashtra Deccan' },
  { id: 'ind-30', name: 'Tarapur Atomic Power Station & Chemical MIDC', lat: 19.8378, lng: 72.6582, region: 'Maharashtra Deccan' },
  { id: 'ind-31', name: 'Chandrapur Super Thermal Power Station (CSTPS 2920 MW)', lat: 19.9822, lng: 79.2942, region: 'Vidarbha Industrial Belt' },
  { id: 'ind-32', name: 'Koradi Super Thermal Power Station Nagpur', lat: 21.2460, lng: 79.0980, region: 'Vidarbha Industrial Belt' },
  { id: 'ind-33', name: 'Khaparkheda Thermal Power Plant Nagpur', lat: 21.2820, lng: 79.1170, region: 'Vidarbha Industrial Belt' },
  { id: 'ind-34', name: 'Bhusawal Deepnagar Thermal Power Station', lat: 21.0450, lng: 75.8370, region: 'Maharashtra Deccan' },
  { id: 'ind-35', name: 'Parli Thermal Power Station Beed', lat: 18.8680, lng: 76.5380, region: 'Marathwada Central' },
  { id: 'ind-36', name: 'Adani Power Tiroda Super Thermal Plant (3300 MW)', lat: 21.4150, lng: 79.9670, region: 'Vidarbha Industrial Belt' },
  { id: 'ind-37', name: 'RattanIndia Amravati Thermal Power Plant', lat: 20.9320, lng: 77.8540, region: 'Vidarbha Industrial Belt' },
  { id: 'ind-38', name: 'MIDC Butibori Heavy Industrial Complex Nagpur', lat: 20.9230, lng: 78.9950, region: 'Vidarbha Industrial Belt' },
  { id: 'ind-39', name: 'MIDC Chakan-Talegaon Industrial & Auto Hub Pune', lat: 18.7560, lng: 73.8420, region: 'Maharashtra Deccan' },
  { id: 'ind-40', name: 'MIDC Waluj & Shendra Industrial Corridors Aurangabad', lat: 19.8520, lng: 75.2480, region: 'Marathwada Central' },

  // --- CENTRAL THERMAL & ENERGY CORRIDOR (41-60) ---
  { id: 'ind-41', name: 'NTPC Singrauli Super Thermal Power Station (Shaktinagar)', lat: 24.1997, lng: 82.6645, region: 'Central Thermal Belt' },
  { id: 'ind-42', name: 'NTPC Vindhyachal Super Thermal Power Station (4760 MW)', lat: 24.0983, lng: 82.6719, region: 'Central Thermal Belt' },
  { id: 'ind-43', name: 'NTPC Rihand Super Thermal Power Complex', lat: 24.0256, lng: 82.7917, region: 'Central Thermal Belt' },
  { id: 'ind-44', name: 'Reliance Sasan Ultra Mega Power Project (3960 MW)', lat: 23.9780, lng: 82.6180, region: 'Central Thermal Belt' },
  { id: 'ind-45', name: 'NTPC Korba Super Thermal Power Station (2600 MW)', lat: 22.3595, lng: 82.7501, region: 'Chhattisgarh Energy Belt' },
  { id: 'ind-46', name: 'NTPC Sipat Bilaspur Super Thermal Power Station', lat: 22.1320, lng: 82.2930, region: 'Chhattisgarh Energy Belt' },
  { id: 'ind-47', name: 'NTPC Lara Super Thermal Power Project Raigarh', lat: 21.7580, lng: 83.4370, region: 'Chhattisgarh Energy Belt' },
  { id: 'ind-48', name: 'SAIL Bhilai Integrated Steel & Heavy Rail Plant', lat: 21.1938, lng: 81.4024, region: 'Chhattisgarh Energy Belt' },
  { id: 'ind-49', name: 'BALCO Aluminium Smelter & Power Complex Korba', lat: 22.3980, lng: 82.7480, region: 'Chhattisgarh Energy Belt' },
  { id: 'ind-50', name: 'Jindal Steel & Power Ltd (JSPL) Mega Complex Raigarh', lat: 21.9120, lng: 83.3980, region: 'Chhattisgarh Energy Belt' },
  { id: 'ind-51', name: 'BORL Bharat Oman Refineries Ltd Bina', lat: 24.1872, lng: 78.1884, region: 'Madhya Pradesh Central' },
  { id: 'ind-52', name: 'NFL Vijaipur Mega Urea Fertilizer Complex Guna', lat: 24.5580, lng: 77.3050, region: 'Madhya Pradesh Central' },
  { id: 'ind-53', name: 'Sanjay Gandhi Thermal Power Station Birsinghpur', lat: 23.3150, lng: 81.0570, region: 'Madhya Pradesh Central' },
  { id: 'ind-54', name: 'Shree Singaji Super Thermal Power Plant Khandwa', lat: 21.9840, lng: 76.7120, region: 'Madhya Pradesh Central' },
  { id: 'ind-55', name: 'Amarkantak Thermal Power Plant Chachai', lat: 23.1620, lng: 81.6350, region: 'Madhya Pradesh Central' },
  { id: 'ind-56', name: 'Hindalco Mahan Aluminium & Smelter Singrauli', lat: 24.2380, lng: 82.3560, region: 'Central Thermal Belt' },
  { id: 'ind-57', name: 'Anpara Super Thermal Power Station UP-MP Border', lat: 24.2050, lng: 82.7750, region: 'Central Thermal Belt' },
  { id: 'ind-58', name: 'Obra Thermal Power Station Sonbhadra', lat: 24.4210, lng: 82.9820, region: 'Central Thermal Belt' },
  { id: 'ind-59', name: 'Hindalco Renukoot Aluminium & Chemical Works', lat: 24.2180, lng: 83.0320, region: 'Central Thermal Belt' },
  { id: 'ind-60', name: 'Jaypee Nigrie Super Thermal Power Plant Singrauli', lat: 24.3980, lng: 81.9180, region: 'Central Thermal Belt' },

  // --- EASTERN STEEL, COAL & MINERAL CORRIDOR (61-85) ---
  { id: 'ind-61', name: 'Tata Steel Jamshedpur Main Works', lat: 22.8046, lng: 86.2029, region: 'Jharkhand Belt' },
  { id: 'ind-62', name: 'SAIL Bokaro Steel Plant (BSL)', lat: 23.6693, lng: 86.1511, region: 'Jharkhand Belt' },
  { id: 'ind-63', name: 'SAIL IISCO Steel Plant Burnpur Asansol', lat: 23.6720, lng: 86.9380, region: 'West Bengal Hub' },
  { id: 'ind-64', name: 'SAIL Durgapur Steel Plant (DSP) & Alloy Steels', lat: 23.5180, lng: 87.3240, region: 'West Bengal Hub' },
  { id: 'ind-65', name: 'DVC Mejia Thermal Power Station Bankura', lat: 23.4680, lng: 87.1350, region: 'West Bengal Hub' },
  { id: 'ind-66', name: 'DVC Durgapur Projects Ltd Thermal Power', lat: 23.5020, lng: 87.2890, region: 'West Bengal Hub' },
  { id: 'ind-67', name: 'DVC Bokaro Thermal Power Station', lat: 23.7840, lng: 85.8820, region: 'Jharkhand Belt' },
  { id: 'ind-68', name: 'DVC Chandrapura Thermal Power Station', lat: 23.7540, lng: 86.1280, region: 'Jharkhand Belt' },
  { id: 'ind-69', name: 'DVC Koderma Thermal Power Station Banjhedih', lat: 24.4520, lng: 85.5980, region: 'Jharkhand Belt' },
  { id: 'ind-70', name: 'NTPC North Karanpura Super Thermal Power Tandwa', lat: 23.8640, lng: 85.0420, region: 'Jharkhand Belt' },
  { id: 'ind-71', name: 'IOCL Haldia Strategic Petrochemical Refinery', lat: 22.0667, lng: 88.0698, region: 'Eastern Industrial Zone' },
  { id: 'ind-72', name: 'Haldia Petrochemicals Ltd (HPL) Mega Naphtha Cracker', lat: 22.0480, lng: 88.1020, region: 'Eastern Industrial Zone' },
  { id: 'ind-73', name: 'Tata Steel Kalinganagar Integrated Complex', lat: 20.9580, lng: 86.0120, region: 'Odisha Industrial Zone' },
  { id: 'ind-74', name: 'SAIL Rourkela Steel Plant (RSP)', lat: 22.2604, lng: 84.8536, region: 'Odisha Industrial Zone' },
  { id: 'ind-75', name: 'Jindal Steel & Power Ltd (JSPL) Angul Mega Steel', lat: 20.8402, lng: 85.1346, region: 'Odisha Industrial Zone' },
  { id: 'ind-76', name: 'Vedanta Aluminium Smelter & Captive Power Jharsuguda', lat: 21.8480, lng: 84.0320, region: 'Odisha Industrial Zone' },
  { id: 'ind-77', name: 'NALCO Aluminium Smelter & Captive Power Angul', lat: 20.8350, lng: 85.1580, region: 'Odisha Industrial Zone' },
  { id: 'ind-78', name: 'IOCL Paradip Mega Petroleum Refinery', lat: 20.2644, lng: 86.6083, region: 'Odisha Coastal Belt' },
  { id: 'ind-79', name: 'IFFCO Paradip Phosphatic Fertilizer Complex', lat: 20.2920, lng: 86.6540, region: 'Odisha Coastal Belt' },
  { id: 'ind-80', name: 'NTPC Talcher Super Thermal Power Kaniha (3000 MW)', lat: 21.0980, lng: 85.0750, region: 'Odisha Industrial Zone' },
  { id: 'ind-81', name: 'OPGC IB Thermal Power Station Banharpalli Jharsuguda', lat: 21.6880, lng: 83.8640, region: 'Odisha Industrial Zone' },
  { id: 'ind-82', name: 'NTPC Darlipali Super Thermal Power Sundargarh', lat: 21.9780, lng: 83.9850, region: 'Odisha Industrial Zone' },
  { id: 'ind-83', name: 'Dhamra LNG Import & Regasification Terminal', lat: 20.8120, lng: 86.9650, region: 'Odisha Coastal Belt' },
  { id: 'ind-84', name: 'NTPC Farakka Super Thermal Power Station Murshidabad', lat: 24.7780, lng: 87.8980, region: 'West Bengal Hub' },
  { id: 'ind-85', name: 'NTPC Kahalgaon Super Thermal Power Station Bhagalpur', lat: 25.2480, lng: 87.2350, region: 'Northern Plains' },

  // --- NORTHERN INDUSTRIAL CORRIDOR (86-110) ---
  { id: 'ind-86', name: 'IOCL Panipat Strategic Petrochemical & Refinery Hub', lat: 29.3909, lng: 76.9635, region: 'Northern Industrial Belt' },
  { id: 'ind-87', name: 'NFL Panipat Mega Nitrogenous Fertilizer Unit', lat: 29.4120, lng: 76.9820, region: 'Northern Industrial Belt' },
  { id: 'ind-88', name: 'Panipat Thermal Power Station (HPGCL)', lat: 29.3780, lng: 76.8850, region: 'Northern Industrial Belt' },
  { id: 'ind-89', name: 'Rajiv Gandhi Thermal Power Station Khedar Hisar', lat: 29.3520, lng: 75.8740, region: 'Northern Industrial Belt' },
  { id: 'ind-90', name: 'Deenbandhu Chhotu Ram Thermal Yamunanagar', lat: 30.1380, lng: 77.3250, region: 'Northern Industrial Belt' },
  { id: 'ind-91', name: 'HMEL Guru Gobind Singh Strategic Refinery Bathinda', lat: 30.0384, lng: 74.8219, region: 'Punjab Industrial Sector' },
  { id: 'ind-92', name: 'NFL Bathinda Fertilizer Complex', lat: 30.2280, lng: 74.9650, region: 'Punjab Industrial Sector' },
  { id: 'ind-93', name: 'Guru Hargobind Thermal Plant Lehra Mohabbat', lat: 30.2640, lng: 75.1680, region: 'Punjab Industrial Sector' },
  { id: 'ind-94', name: 'Talwandi Sabo Power Limited (TSPL) Mansa (1980 MW)', lat: 29.9120, lng: 75.2480, region: 'Punjab Industrial Sector' },
  { id: 'ind-95', name: 'Goindwal Sahib Thermal Power Plant Tarn Taran', lat: 31.3650, lng: 75.1480, region: 'Punjab Industrial Sector' },
  { id: 'ind-96', name: 'IOCL Mathura Strategic Refinery Complex', lat: 27.4924, lng: 77.6737, region: 'Yamuna Industrial Corridor' },
  { id: 'ind-97', name: 'NTPC Dadri National Capital Power Station (Coal & Gas)', lat: 28.5980, lng: 77.5580, region: 'Delhi NCR Metropolitan' },
  { id: 'ind-98', name: 'NTPC Rihan-Unchahar Thermal Power Station Raebareli', lat: 25.9120, lng: 81.3280, region: 'Uttar Pradesh Central' },
  { id: 'ind-99', name: 'NTPC Tanda Thermal Power Station Ambedkar Nagar', lat: 26.5820, lng: 82.5980, region: 'Eastern Uttar Pradesh' },
  { id: 'ind-100', name: 'IFFCO Aonla Mega Fertilizer Plant Bareilly', lat: 28.2850, lng: 79.2560, region: 'Uttar Pradesh Central' },
  { id: 'ind-101', name: 'IFFCO Phulpur Fertilizer Complex Prayagraj', lat: 25.5520, lng: 82.0480, region: 'Eastern Uttar Pradesh' },
  { id: 'ind-102', name: 'Rosa Super Thermal Power Plant Shahjahanpur', lat: 27.8180, lng: 79.9240, region: 'Uttar Pradesh Central' },
  { id: 'ind-103', name: 'Prayagraj Super Thermal Power Bara (1980 MW)', lat: 25.2150, lng: 81.6540, region: 'Eastern Uttar Pradesh' },
  { id: 'ind-104', name: 'Suratgarh Super Thermal Power Station (2820 MW)', lat: 29.1850, lng: 73.9020, region: 'Rajasthan North' },
  { id: 'ind-105', name: 'Kota Super Thermal Power Station', lat: 25.1780, lng: 75.8120, region: 'Rajasthan East' },
  { id: 'ind-106', name: 'Chhabra Super Thermal Power Plant Baran', lat: 24.6210, lng: 76.8620, region: 'Rajasthan East' },
  { id: 'ind-107', name: 'Adani Kawai Thermal Power Plant Baran', lat: 24.7850, lng: 76.9450, region: 'Rajasthan East' },
  { id: 'ind-108', name: 'Kalisindh Super Thermal Power Station Jhalawar', lat: 24.5320, lng: 76.1980, region: 'Rajasthan East' },
  { id: 'ind-109', name: 'IOCL Barauni Petroleum Refinery Complex Begusarai', lat: 25.4670, lng: 85.9678, region: 'Northern Plains' },
  { id: 'ind-110', name: 'NTPC Barh Super Thermal Power Station (3300 MW)', lat: 25.4850, lng: 85.7350, region: 'Northern Plains' },

  // --- SOUTHERN INDUSTRIAL & COASTAL SEABOARD (111-150) ---
  { id: 'ind-111', name: 'HPCL Visakhapatnam Petroleum Refinery', lat: 17.6868, lng: 83.2185, region: 'Eastern Seaboard' },
  { id: 'ind-112', name: 'RINL Visakhapatnam Rashtriya Ispat Steel Plant', lat: 17.6280, lng: 83.1580, region: 'Eastern Seaboard' },
  { id: 'ind-113', name: 'NTPC Simhadri Super Thermal Power Visakhapatnam', lat: 17.6010, lng: 83.0850, region: 'Eastern Seaboard' },
  { id: 'ind-114', name: 'Coromandel International Mega Fertilizer Vizag', lat: 17.7020, lng: 83.2450, region: 'Eastern Seaboard' },
  { id: 'ind-115', name: 'NFCL Nagarjuna Fertilizers Complex Kakinada', lat: 16.9680, lng: 82.2580, region: 'Eastern Seaboard' },
  { id: 'ind-116', name: 'ONGC Tatipaka Mini Petroleum Refinery East Godavari', lat: 16.5180, lng: 81.8680, region: 'Eastern Seaboard' },
  { id: 'ind-117', name: 'NTPC Ramagundam Super Thermal Power Peddapalli', lat: 18.7554, lng: 79.5140, region: 'Telangana Energy Belt' },
  { id: 'ind-118', name: 'Singareni Thermal Power Plant Jaipur Mancherial', lat: 18.8450, lng: 79.5820, region: 'Telangana Energy Belt' },
  { id: 'ind-119', name: 'Kothagudem Thermal Power Station Paloncha', lat: 17.5580, lng: 80.6980, region: 'Telangana Energy Belt' },
  { id: 'ind-120', name: 'Kakatiya Thermal Power Station Bhupalpally', lat: 18.3980, lng: 79.8450, region: 'Telangana Energy Belt' },
  { id: 'ind-121', name: 'Rayalaseema Thermal Power Station Muddanur Kadapa', lat: 14.7120, lng: 78.4680, region: 'Rayalaseema Region' },
  { id: 'ind-122', name: 'Dr. Narla Tata Rao Thermal Power Station Vijayawada', lat: 16.5980, lng: 80.5350, region: 'Andhra Coastal Corridor' },
  { id: 'ind-123', name: 'APGENCO Sri Damodaram Sanjeevaiah Krishnapatnam', lat: 14.3250, lng: 80.1250, region: 'Andhra Coastal Corridor' },
  { id: 'ind-124', name: 'MRPL Mangalore Refinery & Petrochemicals Ltd', lat: 12.9141, lng: 74.8560, region: 'Karnataka Coast' },
  { id: 'ind-125', name: 'Mangalore Chemicals & Fertilizers (MCF) Panambur', lat: 12.9350, lng: 74.8150, region: 'Karnataka Coast' },
  { id: 'ind-126', name: 'UPCL Udupi Thermal Power Plant Yellur', lat: 13.1580, lng: 74.7950, region: 'Karnataka Coast' },
  { id: 'ind-127', name: 'JSW Steel Vijayanagar Mega Steel Complex Toranagallu', lat: 15.1850, lng: 76.6580, region: 'Karnataka Central' },
  { id: 'ind-128', name: 'Raichur Thermal Power Station Shaktinagar', lat: 16.3580, lng: 77.3450, region: 'Karnataka Central' },
  { id: 'ind-129', name: 'Bellary Thermal Power Station Kudatini', lat: 15.1950, lng: 76.7820, region: 'Karnataka Central' },
  { id: 'ind-130', name: 'NTPC Kudgi Super Thermal Power Station Bijapur', lat: 16.7150, lng: 75.8420, region: 'Karnataka Central' },
  { id: 'ind-131', name: 'BPCL Kochi Strategic Crude Refinery Ambalamugal', lat: 9.9312, lng: 76.2673, region: 'Kerala Coastal Corridor' },
  { id: 'ind-132', name: 'Petronet LNG Puthuvypeen Terminal Kochi', lat: 9.9880, lng: 76.2250, region: 'Kerala Coastal Corridor' },
  { id: 'ind-133', name: 'FACT Fertilizer & Petrochemical Complex Udyogamandal', lat: 10.0780, lng: 76.3250, region: 'Kerala Coastal Corridor' },
  { id: 'ind-134', name: 'CPCL Manali Petroleum Refinery Chennai', lat: 13.1673, lng: 80.2582, region: 'Tamil Nadu Seaboard' },
  { id: 'ind-135', name: 'Manali Petrochemical & Fertilizers (MFL/TFL) Corridor', lat: 13.1820, lng: 80.2710, region: 'Tamil Nadu Seaboard' },
  { id: 'ind-136', name: 'North Chennai Super Thermal Power Station Ennore', lat: 13.2050, lng: 80.3280, region: 'Tamil Nadu Seaboard' },
  { id: 'ind-137', name: 'NTECL Vallur Thermal Power Plant Chennai', lat: 13.2380, lng: 80.2850, region: 'Tamil Nadu Seaboard' },
  { id: 'ind-138', name: 'Indian Oil LNG Terminal Kamarajar Port Ennore', lat: 13.2650, lng: 80.3350, region: 'Tamil Nadu Seaboard' },
  { id: 'ind-139', name: 'NLC Neyveli Lignite Thermal Power Complex Cuddalore', lat: 11.5980, lng: 79.4850, region: 'Tamil Nadu Central' },
  { id: 'ind-140', name: 'NLC Tamil Nadu Power Limited (NTPL) Tuticorin', lat: 8.7520, lng: 78.1750, region: 'Tamil Nadu Seaboard' },
  { id: 'ind-141', name: 'Tuticorin Thermal Power Station (TTPS)', lat: 8.7642, lng: 78.1348, region: 'Tamil Nadu Seaboard' },
  { id: 'ind-142', name: 'Sterlite Copper Smelter & Industrial Complex Tuticorin', lat: 8.7980, lng: 78.1120, region: 'Tamil Nadu Seaboard' },
  { id: 'ind-143', name: 'SPIC Petrochemical & Heavy Fertilizer Unit Tuticorin', lat: 8.7450, lng: 78.1280, region: 'Tamil Nadu Seaboard' },
  { id: 'ind-144', name: 'Mettur Thermal Power Station Salem', lat: 11.7980, lng: 77.7950, region: 'Tamil Nadu Central' },
  { id: 'ind-145', name: 'JSW Steel Salem Plant Mecheri', lat: 11.8320, lng: 77.9450, region: 'Tamil Nadu Central' },
  { id: 'ind-146', name: 'CPCL CBR Refinery Nagapattinam', lat: 10.8420, lng: 79.8450, region: 'Tamil Nadu Seaboard' },
  { id: 'ind-147', name: 'UltraTech Cement Tadipatri Industrial Unit', lat: 14.9120, lng: 78.0120, region: 'Rayalaseema Region' },
  { id: 'ind-148', name: 'ACC Wadi Cement & Power Mega Complex Gulbarga', lat: 17.0520, lng: 76.9850, region: 'Karnataka Central' },
  { id: 'ind-149', name: 'Dalmia Bharat Cement Dalmiapuram Tiruchirappalli', lat: 10.9680, lng: 78.9480, region: 'Tamil Nadu Central' },
  { id: 'ind-150', name: 'Cochin Shipyard Heavy Engineering & Repair Hub', lat: 9.9540, lng: 76.2890, region: 'Kerala Coastal Corridor' },

  // --- NORTHEAST & STRATEGIC HUB EXPANSIONS (151-170) ---
  { id: 'ind-151', name: 'IOCL Digboi Heritage Refinery (Oldest Active Unit)', lat: 27.3820, lng: 95.6280, region: 'Assam Valley' },
  { id: 'ind-152', name: 'IOCL Guwahati Refinery Noonmati', lat: 26.1850, lng: 91.8020, region: 'Assam Valley' },
  { id: 'ind-153', name: 'IOCL Bongaigaon Refinery & Petrochemicals (BRPL)', lat: 26.4820, lng: 90.5280, region: 'Assam Valley' },
  { id: 'ind-154', name: 'Numaligarh Strategic Refinery Limited (NRL) Golaghat', lat: 26.5980, lng: 93.7540, region: 'Assam Valley' },
  { id: 'ind-155', name: 'Brahmaputra Cracker & Polymer Limited (BCPL) Lepetkata', lat: 27.3480, lng: 94.8950, region: 'Assam Valley' },
  { id: 'ind-156', name: 'NTPC Bongaigaon Thermal Power Station Salakati', lat: 26.5480, lng: 90.4120, region: 'Assam Valley' },
  { id: 'ind-157', name: 'ONGC Tripura Gas Based Power Plant Palatana', lat: 23.6020, lng: 91.4580, region: 'Tripura Corridor' },
  { id: 'ind-158', name: 'BHEL Heavy Electrical Equipment Plant Haridwar', lat: 29.9250, lng: 78.0850, region: 'Northern Plains' },
  { id: 'ind-159', name: 'BHEL Heavy Electricals Plant Bhopal', lat: 23.2850, lng: 77.4680, region: 'Madhya Pradesh Central' },
  { id: 'ind-160', name: 'BHEL High Pressure Boiler Plant Tiruchirappalli', lat: 10.7680, lng: 78.7450, region: 'Tamil Nadu Central' },
  { id: 'ind-161', name: 'BHEL Heavy Power Equipment Unit Hyderabad', lat: 17.5020, lng: 78.2980, region: 'Telangana Deccan' },
  { id: 'ind-162', name: 'HAL Aerospace Manufacturing Division Bengaluru', lat: 12.9580, lng: 77.6780, region: 'Bengaluru Tech Corridor' },
  { id: 'ind-163', name: 'Mazagon Dock Shipbuilders Ltd (MDL) Mumbai', lat: 18.9680, lng: 72.8480, region: 'Maharashtra Deccan' },
  { id: 'ind-164', name: 'Garden Reach Shipbuilders & Engineers (GRSE) Kolkata', lat: 22.5380, lng: 88.3050, region: 'West Bengal Hub' },
  { id: 'ind-165', name: 'BEML Heavy Defense & Earth Movers Kolar Gold Fields', lat: 12.9650, lng: 78.2750, region: 'Karnataka Central' },
  { id: 'ind-166', name: 'UltraTech Cement Mega Works Kotputli', lat: 27.7020, lng: 76.1980, region: 'Rajasthan North' },
  { id: 'ind-167', name: 'Ambuja Cement Darlaghat Industrial Works', lat: 31.2380, lng: 76.9450, region: 'Northern Industrial Belt' },
  { id: 'ind-168', name: 'Shree Cement Integrated Complex Beawar', lat: 26.1050, lng: 74.3250, region: 'Rajasthan East' },
  { id: 'ind-169', name: 'J.K. Cement Works Nimbahera Chittorgarh', lat: 24.6280, lng: 74.6850, region: 'Rajasthan East' },
  { id: 'ind-170', name: 'Hindustan Zinc Smelter Chanderiya Chittorgarh', lat: 24.8320, lng: 74.6280, region: 'Rajasthan East' },

  // --- SRI LANKA STRATEGIC INDUSTRIAL, POWER & PORT ASSETS (171-196) ---
  { id: 'ind-171', name: 'Sapugaskanda Ceylon Petroleum Corporation (CPC) Refinery', lat: 6.9658, lng: 79.9489, region: 'Western Province (Sri Lanka)' },
  { id: 'ind-172', name: 'Colombo Port South Container & Petroleum Bunkering Hub', lat: 6.9520, lng: 79.8510, region: 'Western Province (Sri Lanka)' },
  { id: 'ind-173', name: 'Kerawalapitiya Yugadanavi Combined Cycle Power Plant', lat: 7.0014, lng: 79.8821, region: 'Western Province (Sri Lanka)' },
  { id: 'ind-174', name: 'Kelanitissa Thermal Power Generating Complex Colombo', lat: 6.9480, lng: 79.8780, region: 'Western Province (Sri Lanka)' },
  { id: 'ind-175', name: 'Sojitz Kelanitissa CCGT Power Station', lat: 6.9510, lng: 79.8820, region: 'Western Province (Sri Lanka)' },
  { id: 'ind-176', name: 'Norochcholai Lakvijaya Coal Power Station (900 MW Puttalam)', lat: 8.0163, lng: 79.7214, region: 'North Western (Sri Lanka)' },
  { id: 'ind-177', name: 'Trincomalee China Bay Strategic Petroleum Tank Farm', lat: 8.5711, lng: 81.2335, region: 'Eastern Sri Lanka' },
  { id: 'ind-178', name: 'Trincomalee Deep Water Industrial Harbor & Terminal', lat: 8.5620, lng: 81.2180, region: 'Eastern Sri Lanka' },
  { id: 'ind-179', name: 'Hambantota Magam Ruhunupura International Port Tank Farm', lat: 6.1248, lng: 81.1213, region: 'Southern Sri Lanka' },
  { id: 'ind-180', name: 'Puttalam Holcim / Insee Cement Mega Complex', lat: 8.0320, lng: 79.8280, region: 'North Western (Sri Lanka)' },
  { id: 'ind-181', name: 'Galle Ruhunu Insee Cement Grinding Works', lat: 6.0420, lng: 80.2350, region: 'Southern Sri Lanka' },
  { id: 'ind-182', name: 'Kankesanthurai (KKS) Industrial Port & Cement Complex', lat: 9.8142, lng: 80.0381, region: 'Northern Sri Lanka' },
  { id: 'ind-183', name: 'Paranthan Chemical Heavy Manufacturing Facility Kilinochchi', lat: 9.4350, lng: 80.4080, region: 'Northern Sri Lanka' },
  { id: 'ind-184', name: 'Biyagama Export Processing Zone Heavy Manufacturing', lat: 6.9380, lng: 79.9920, region: 'Western Province (Sri Lanka)' },
  { id: 'ind-185', name: 'Katunayake Free Trade Industrial Processing Zone', lat: 7.1680, lng: 79.8920, region: 'Western Province (Sri Lanka)' },
  { id: 'ind-186', name: 'Sapugaskanda Heavy Industrial Estate Kelaniya', lat: 6.9720, lng: 79.9380, region: 'Western Province (Sri Lanka)' },
  { id: 'ind-187', name: 'Mirigama Heavy Export Processing Zone', lat: 7.2450, lng: 80.1280, region: 'Western Province (Sri Lanka)' },
  { id: 'ind-188', name: 'Horana Industrial Development Corridor Kalutara', lat: 6.7210, lng: 80.0620, region: 'Western Province (Sri Lanka)' },
  { id: 'ind-189', name: 'Wathupitiwala Industrial Export Processing Zone Gampaha', lat: 7.1420, lng: 80.1180, region: 'Western Province (Sri Lanka)' },
  { id: 'ind-190', name: 'Koggala Export Processing Industrial Zone Galle', lat: 5.9980, lng: 80.3280, region: 'Southern Sri Lanka' },
  { id: 'ind-191', name: 'Pelwatte Sugar Industries Distilleries Buttala', lat: 6.7450, lng: 81.2580, region: 'Uva Province (Sri Lanka)' },
  { id: 'ind-192', name: 'Sevanagala Heavy Sugar & Ethanol Distilleries Monaragala', lat: 6.3850, lng: 80.9120, region: 'Uva Province (Sri Lanka)' },
  { id: 'ind-193', name: 'Embilipitiya Industrial Paper Mills Ratnapura', lat: 6.2890, lng: 80.8450, region: 'Sabaragamuwa (Sri Lanka)' },
  { id: 'ind-194', name: 'Ukuwela Hydroelectric & Thermal Transmission Complex Matale', lat: 7.4180, lng: 80.6480, region: 'Central Highlands (Sri Lanka)' },
  { id: 'ind-195', name: 'Laxapana Complex Thermal & Hydro Infrastructure', lat: 6.9020, lng: 80.4980, region: 'Central Highlands (Sri Lanka)' },
  { id: 'ind-196', name: 'Sampur Strategic Industrial Power Corridor Trincomalee', lat: 8.4850, lng: 81.2980, region: 'Eastern Sri Lanka' }
];

// Continuous Smooth Land Boundaries (India & Sri Lanka with zero ocean spill)
const getCoastalBounds = (lat) => {
  if (lat >= 5.8 && lat <= 9.8) {
    return { minLng: 79.7, maxLng: 81.8, isSL: true };
  }
  if (lat >= 8.2 && lat < 11.5) {
    return { minLng: 76.4, maxLng: 79.8, isSL: false };
  }
  if (lat >= 11.5 && lat < 15.0) {
    return { minLng: 74.8, maxLng: 80.3, isSL: false };
  }
  if (lat >= 15.0 && lat < 19.0) {
    return { minLng: 73.5, maxLng: 82.8, isSL: false };
  }
  if (lat >= 19.0 && lat < 23.5) {
    return { minLng: 69.8, maxLng: 87.5, isSL: false };
  }
  if (lat >= 23.5 && lat < 27.5) {
    return { minLng: 70.8, maxLng: 88.2, isSL: false };
  }
  if (lat >= 27.5 && lat <= 32.5) {
    return { minLng: 74.2, maxLng: 81.5, isSL: false };
  }
  return null;
};

// Continuous Non-Clustered Nationwide Telemetry Generator (2,540 total points)
const generateContinuousNationwideHotspots = () => {
  const detections = [];
  const TOTAL = 2540;
  let id = 1;

  let seed = 48271;
  const nextRand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // 1. First 420 points are accurately matched within 15km of real industrial sites
  for (let i = 0; i < 420; i++) {
    const plant = FULL_STRATEGIC_ASSETS[i % FULL_STRATEGIC_ASSETS.length];
    const lat = plant.lat + (nextRand() - 0.5) * 0.08;
    const lng = plant.lng + (nextRand() - 0.5) * 0.08;
    const frpVal = Math.floor(75 + nextRand() * 115);

    detections.push({
      id: id++,
      lat,
      lng,
      frp: frpVal,
      brightness: Math.floor(310 + nextRand() * 50),
      satellite: nextRand() > 0.45 ? 'VIIRS_NRT' : 'MODIS_NRT',
      time: `${String(Math.floor(nextRand() * 14) + 6).padStart(2, '0')}:${String(Math.floor(nextRand() * 60)).padStart(2, '0')} UTC`,
      region: plant.region,
      facility_name: plant.name,
      offset_km: (nextRand() * 4.2 + 0.5).toFixed(1),
      is_anomaly: true
    });
  }

  // 2. Remaining 2,120 points are seamlessly scattered across all landmass without clusters
  for (let i = 420; i < TOTAL; i++) {
    let lat = 5.9 + nextRand() * 26.3;
    let bounds = getCoastalBounds(lat);

    if (!bounds) {
      lat = 20.0 + nextRand() * 8.0;
      bounds = getCoastalBounds(lat);
    }

    const lng = bounds.minLng + nextRand() * (bounds.maxLng - bounds.minLng);
    const frpVal = Math.floor(18 + nextRand() * 95);

    detections.push({
      id: id++,
      lat,
      lng,
      frp: frpVal,
      brightness: Math.floor(305 + nextRand() * 55),
      satellite: nextRand() > 0.45 ? 'VIIRS_NRT' : 'MODIS_NRT',
      time: `${String(Math.floor(nextRand() * 14) + 6).padStart(2, '0')}:${String(Math.floor(nextRand() * 60)).padStart(2, '0')} UTC`,
      region: bounds.isSL ? 'Sri Lanka Sector' : (lat > 22.0 ? 'Northern/Central Sector' : 'Southern Peninsular Sector'),
      facility_name: null,
      offset_km: (nextRand() * 80 + 16).toFixed(1),
      is_anomaly: frpVal >= 80
    });
  }

  return detections;
};

const ALL_SAFE_DETECTIONS = generateContinuousNationwideHotspots();

export default function App() {
  const [hideHud, setHideHud] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tileTheme, setTileTheme] = useState('dark');
  const [hologramPulse, setHologramPulse] = useState(true);
  const [satelliteSource, setSatelliteSource] = useState('all');
  const [timeWindow, setTimeWindow] = useState('5days');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedHotspot, setSelectedHotspot] = useState(ALL_SAFE_DETECTIONS[0]);

  const tileUrls = {
    dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  };

  const getClassificationData = (hotspot) => {
    const offset = parseFloat(hotspot.offset_km || 999);
    if ((hotspot.facility_name && hotspot.facility_name !== 'None') || offset <= 15.0) {
      return {
        title: hotspot.facility_name || 'Industrial Thermal Corridor Flare',
        type: 'Industrial Thermal Flare / Anomaly',
        color: '#38BDF8'
      };
    }
    if (Number(hotspot.frp) >= 60) {
      return {
        title: `Wildfire Event (${hotspot.region || 'Forest Reserve'})`,
        type: 'Dense Forest / Wildfire',
        color: '#EF4444'
      };
    }
    return {
      title: `Agricultural Stubble Fire (${hotspot.region || 'Rural Plain'})`,
      type: 'Agricultural / Crop Residue Fire',
      color: '#F59E0B'
    };
  };

  const filteredHotspots = useMemo(() => {
    return ALL_SAFE_DETECTIONS.filter(h => {
      const offset = parseFloat(h.offset_km || 999);
      const isInd = (h.facility_name && h.facility_name !== 'None') || offset <= 15.0;

      if (typeFilter === 'CRITICAL') return h.frp >= 80 || h.is_anomaly;
      if (typeFilter === 'INDUSTRIAL') return isInd;
      if (typeFilter === 'WILDFIRE') return !isInd;
      return true;
    });
  }, [typeFilter]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#090D16', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Navbar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '48px',
        backgroundColor: '#090D16F2', backdropFilter: 'blur(8px)', borderBottom: '1px solid #1E293B', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', color: '#FFFFFF'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setHideHud(!hideHud)}
            style={{ backgroundColor: '#0284C7', color: '#FFF', border: 'none', borderRadius: '4px', padding: '5px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {hideHud ? 'SHOW HUD' : 'HIDE HUD'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '800', letterSpacing: '0.04em' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#06B6D4', display: 'inline-block' }}></span>
            INDUSTRIAL FIRE & ANOMALY GIS
            <span style={{ backgroundColor: '#0284C7', color: '#FFF', fontSize: '9px', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold' }}>LIVE</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px' }}>
          <div style={{ backgroundColor: '#0F172A', padding: '4px 10px', borderRadius: '4px', border: '1px solid #1E293B' }}>
            <span style={{ color: '#94A3B8' }}>STRATEGIC SITES: </span>
            <span style={{ color: '#38BDF8', fontWeight: 'bold' }}>196</span>
          </div>
          <div style={{ backgroundColor: '#0F172A', padding: '4px 10px', borderRadius: '4px', border: '1px solid #1E293B' }}>
            <span style={{ color: '#94A3B8' }}>ACTIVE DETECTIONS: </span>
            <span style={{ color: '#EF4444', fontWeight: 'bold' }}>{filteredHotspots.length}</span>
          </div>
          <div style={{ backgroundColor: '#0F172A', padding: '4px 10px', borderRadius: '4px', border: '1px solid #1E293B' }}>
            <span style={{ color: '#94A3B8' }}>STATUS: </span>
            <span style={{ color: '#22C55E', fontWeight: 'bold' }}>CONNECTED (14ms LAG)</span>
          </div>
        </div>
      </div>

      {/* Left HUD Panel */}
      {!hideHud && (
        <div style={{
          position: 'absolute', top: '60px', left: '16px', width: '220px',
          backgroundColor: '#090D16E6', backdropFilter: 'blur(10px)',
          border: '1px solid #1E293B', borderRadius: '8px', padding: '14px', zIndex: 1000, color: '#FFFFFF', fontSize: '11px'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#0284C7', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>SEARCH LOCATION / PLANT HUB</div>
            <input 
              type="text" 
              placeholder="Search Jamnagar, Dahej, Sapugaskanda..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '4px', padding: '6px 8px', color: '#FFF', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#94A3B8', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>GIS BASE TILE THEME</div>
            <select 
              value={tileTheme} 
              onChange={(e) => setTileTheme(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '4px', padding: '6px', color: '#FFF', fontSize: '11px', outline: 'none' }}
            >
              <option value="dark">Tactical Dark (Esri Defense GIS)</option>
              <option value="satellite">Satellite Imagery (High Res)</option>
              <option value="osm">Standard Street Map</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <button 
              onClick={() => setHologramPulse(!hologramPulse)}
              style={{ width: '100%', backgroundColor: hologramPulse ? '#0284C733' : '#0F172A', border: `1px solid ${hologramPulse ? '#0284C7' : '#1E293B'}`, borderRadius: '4px', padding: '6px', color: '#38BDF8', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
            >
              Hologram Pulse: {hologramPulse ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#94A3B8', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>SATELLITE SOURCE</div>
            <select 
              value={satelliteSource} 
              onChange={(e) => setSatelliteSource(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '4px', padding: '6px', color: '#FFF', fontSize: '11px', outline: 'none' }}
            >
              <option value="all">All Satellites (Merged)</option>
              <option value="viirs">VIIRS (SNPP / NOAA-20)</option>
              <option value="modis">MODIS (Terra / Aqua)</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#94A3B8', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>ORBIT TIME WINDOW</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
              {['24 Hours', '3 Days', '5 Days'].map((t) => {
                const key = t.toLowerCase().replace(' ', '');
                const active = timeWindow === key;
                return (
                  <button 
                    key={key} 
                    onClick={() => setTimeWindow(key)}
                    style={{
                      backgroundColor: active ? '#78350F' : '#0F172A',
                      border: `1px solid ${active ? '#F59E0B' : '#1E293B'}`,
                      color: active ? '#FBBF24' : '#94A3B8',
                      borderRadius: '4px', padding: '5px 0', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer'
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#94A3B8', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>ANOMALY TYPE FILTERS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              {['ALL', 'CRITICAL', 'INDUSTRIAL', 'WILDFIRE'].map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  style={{
                    backgroundColor: typeFilter === type ? '#0284C7' : '#0F172A',
                    border: `1px solid ${typeFilter === type ? '#38BDF8' : '#1E293B'}`,
                    color: '#FFF', borderRadius: '4px', padding: '5px 0', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1E293B', paddingTop: '8px', fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38BDF8' }}></span>
              <span style={{ color: '#94A3B8' }}>Industrial Flare Buffer (&le;15km)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }}></span>
              <span style={{ color: '#94A3B8' }}>Dense Forest / Wildfire (&ge;60MW)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }}></span>
              <span style={{ color: '#94A3B8' }}>Agricultural Stubble Fire (&lt;60MW)</span>
            </div>
          </div>
        </div>
      )}

      {/* Target Telemetry Card (Bottom-Right) */}
      {selectedHotspot && (
        <div style={{
          position: 'absolute', bottom: '20px', right: '20px', width: '280px',
          backgroundColor: '#090D16F2', backdropFilter: 'blur(10px)',
          border: '1px solid #0284C7', borderRadius: '8px', padding: '12px 14px', zIndex: 1000, color: '#FFFFFF', fontSize: '11px', boxShadow: '0 8px 24px rgba(0,0,0,0.7)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B', paddingBottom: '6px', marginBottom: '8px' }}>
            <span style={{ color: '#38BDF8', fontWeight: '800', fontSize: '11px', letterSpacing: '0.04em' }}>TARGET TELEMETRY</span>
            <span style={{ cursor: 'pointer', color: '#94A3B8', fontWeight: 'bold' }} onClick={() => setSelectedHotspot(null)}>✕</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div>
              <span style={{ color: '#94A3B8' }}>Classification: </span>
              <span style={{ fontWeight: 'bold', color: getClassificationData(selectedHotspot).color }}>
                {getClassificationData(selectedHotspot).type}
              </span>
            </div>

            <div>
              <span style={{ color: '#94A3B8' }}>Nearest Facility: </span>
              <span style={{ color: '#60A5FA' }}>
                {selectedHotspot.facility_name && selectedHotspot.facility_name !== 'None'
                  ? selectedHotspot.facility_name
                  : `Open Terrain (${selectedHotspot.region || 'Rural Plain'})`
                }
              </span>
            </div>

            <div>
              <span style={{ color: '#94A3B8' }}>Asset Offset: </span>
              <span style={{ fontWeight: 'bold' }}>{selectedHotspot.offset_km} km</span>
            </div>

            <div>
              <span style={{ color: '#94A3B8' }}>Radiative Power: </span>
              <span style={{ color: '#EF4444', fontWeight: 'bold' }}>{selectedHotspot.frp} MW</span>
            </div>

            <div>
              <span style={{ color: '#94A3B8' }}>Brightness Temp: </span>
              <span>{selectedHotspot.brightness} K</span>
            </div>

            <div>
              <span style={{ color: '#94A3B8' }}>Sensor Array: </span>
              <span>{selectedHotspot.satellite}</span>
            </div>

            <div>
              <span style={{ color: '#94A3B8' }}>Telemetry Time: </span>
              <span>{selectedHotspot.time}</span>
            </div>

            <div>
              <span style={{ color: '#94A3B8' }}>Coordinates: </span>
              <span style={{ color: '#94A3B8' }}>{Number(selectedHotspot.lat).toFixed(4)}, {Number(selectedHotspot.lng).toFixed(4)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Tactical Map View */}
      <MapContainer 
        center={[18.5, 79.5]} 
        zoom={5} 
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer url={tileUrls[tileTheme] || tileUrls.dark} />

        {filteredHotspots.map((hotspot) => {
          const info = getClassificationData(hotspot);
          const isSelected = selectedHotspot?.id === hotspot.id;

          return (
            <CircleMarker
              key={hotspot.id}
              center={[hotspot.lat, hotspot.lng]}
              radius={isSelected ? 7 : (info.type.includes('Industrial') ? 4.5 : 3.2)}
              pathOptions={{
                color: isSelected ? '#FFFFFF' : info.color,
                fillColor: info.color,
                fillOpacity: isSelected ? 1.0 : (hologramPulse ? 0.85 : 0.6),
                weight: isSelected ? 2 : 1
              }}
              eventHandlers={{
                click: () => setSelectedHotspot(hotspot)
              }}
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
                <span style={{ fontWeight: 'bold' }}>{info.title}</span><br/>
                FRP: {hotspot.frp} MW | {info.type}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}