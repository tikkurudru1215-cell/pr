// backend/seed.js

const mongoose = require('mongoose');
const Service = require('./models/Service');
const dotenv = require('dotenv');

dotenv.config();

const services = [
  {
    name: "Government Forms",
    description: "Fill forms with voice guidance",
    keywords: ["form", "forms", "सरकारी फॉर्म", "फॉर्म भरना"],
    response: "फॉर्म भरने में मैं expert हूं! बताइए कौन सा फॉर्म: सरकारी योजना का फॉर्म, बैंक का फॉर्म, राशन कार्ड, आधार कार्ड या पासपोर्ट? आप बस बोलकर जानकारी दे दीजिए, मैं पूरा फॉर्म भर दूंगा। कोई गलती नहीं होगी।"
  },
  {
    name: "Electricity Issue",
    description: "Register & track complaints",
    keywords: ["electricity", "light", "बिजली", "बिजली की शिकायत"],
    response: "बिजली की समस्या के लिए मैं आपकी पूरी मदद करूंगा। आपको क्या चाहिए: नया बिजली कनेक्शन, बिजली बिल की समस्या, या बिजली नहीं आ रही? कृपया बताएं कि कौन सी समस्या है? मैं तुरंत फॉर्म भरने या शिकायत दर्ज करने में मदद करूंगा।"
  },
  {
    name: "Water Problem",
    description: "Lodge water-related issues",
    keywords: ["water", "पानी", "पानी की समस्या"],
    response: "पानी की समस्या के लिए मैं यहाँ हूं। बताइए: नया पानी कनेक्शन चाहिए, पानी नहीं आ रहा, या पाइप लीक हो रहा है? आप जो भी समस्या बताएंगे, मैं तुरंत संबंधित विभाग में शिकायत दर्ज कर दूंगा और आपको reference number भी दूंगा।"
  },
  {
    name: "Medical Help",
    description: "Find hospitals & health services",
    keywords: ["medical", "doctor", "अस्पताल", "दवाई", "डॉक्टर"],
    response: "स्वास्थ्य सेवा के लिए मैं तुरंत मदद करूंगा। बताइए: नजदीकी अस्पताल, दवाई की दुकान, या डॉक्टर की appointment? आपकी location बताइए या कौन सी बीमारी है? मैं तुरंत सही जगह का पता बता दूंगा।"
  },
  {
    name: "Farming Support",
    description: "Agriculture guidance & schemes",
    keywords: ["farming", "किसान", "खेती", "फसल"],
    response: "किसान भाई, खेती-बाड़ी की हर समस्या का समाधान यहाँ है: बीज और खाद की जानकारी, सरकारी योजनाएं, फसल बीमा, मंडी के भाव, या मौसम की जानकारी। आप कौन सी फसल उगाते हैं? या कोई specific problem है? मैं तुरंत सही guidance दूंगा।"
  },
  {
    name: "Education Help",
    description: "Course info & form assistance",
    keywords: ["education", "पढ़ाई", "स्कूल", "college"],
    response: "पढ़ाई और शिक्षा संबंधित सहायता के लिए मैं यहाँ हूं। बताइए: किसी कोर्स के बारे में जानकारी, एडमिशन फॉर्म भरना है, या छात्रवृत्ति योजनाएं?"
  },
  {
    name: "Technical Support",
    description: "Phone, app & website help",
    keywords: ["technical", "support", "तकनीकी"],
    response: "मैं तकनीकी सहायता के लिए तैयार हूं। बताइए, क्या समस्या है? फोन, ऐप, या वेबसाइट से संबंधित?"
  },
  {
    name: "Emergency Help",
    description: "Urgent assistance & contacts",
    keywords: ["emergency", "help", "आपातकालीन", "मदद"],
    response: "आपातकालीन मदद के लिए मैं यहाँ हूँ। मैं आपके लिए नजदीकी पुलिस स्टेशन या अस्पताल का पता और फोन नंबर ढूंढ सकता हूँ। कृपया बताएं कि क्या हुआ है?"
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding.');

    await Service.deleteMany({});
    console.log('Existing services deleted.');

    await Service.insertMany(services);
    console.log('Dummy data inserted successfully.');

    mongoose.connection.close();
  } catch (err) {
    console.error('Error seeding the database:', err);
  }
};

seedDB();