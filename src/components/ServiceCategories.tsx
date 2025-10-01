import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import axios from "axios";

import {
  AlertCircle,
  FileText,
  Lightbulb,
  Droplet,
  
  Leaf,
  GraduationCap,
} from "lucide-react";

// Service type
interface Service {
  _id?: string;
  name: string;
  description: string;
}

interface ServiceCategoriesProps {
  onAIToggle: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ServiceCategories: React.FC<ServiceCategoriesProps> = ({ onAIToggle }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get<Service[]>(`${API_URL}/api/services`);
        setServices(res.data);
        setError("");
      } catch (err: unknown) {
        console.error("Error fetching services:", err);
        setError(
          "Failed to load services. Please check if the backend is running correctly."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const getIcon = (serviceName: string) => {
    switch (serviceName.toLowerCase()) {
      case "government forms":
        return <FileText className="w-8 h-8 text-white" />;
      case "electricity issue":
        return <Lightbulb className="w-8 h-8 text-white" />;
      case "water problem":
        return <Droplet className="w-8 h-8 text-white" />;
      
      case "farming support":
        return <Leaf className="w-8 h-8 text-white" />;
      case "education help":
        return <GraduationCap className="w-8 h-8 text-white" />;
      default:
        return <AlertCircle className="w-8 h-8 text-white" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  if (loading) {
    return (
      <section id="services" className="py-20 px-4 text-center">
        <div className="container mx-auto">
          <p className="text-xl text-white">Loading services...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="py-20 px-4">
      <div className="container mx-auto">
        {/* Title */}
        <motion.div
          ref={ref}
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
              हमारी सेवाएं
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose any service and let our AI assistant guide you through the
            process with simple voice commands
          </p>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="text-center text-red-400 my-8">{error}</div>
        )}

        {/* Services Grid */}
        {services.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            {services.map((service, index) => (
              <motion.div
                key={service._id || index}
                variants={itemVariants}
                onClick={onAIToggle}
                className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Hover background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

                <div className="relative z-10 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                      {getIcon(service.name)}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-white transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                    {service.description}
                  </p>
                </div>

                {/* Glow dot */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center text-gray-400">
            No services available. Please check the backend connection and data.
          </div>
        )}

        {/* Voice Assistant Button */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <motion.button
            onClick={onAIToggle}
            className="bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 px-8 py-4 rounded-full font-bold text-lg shadow-xl flex items-center space-x-3 mx-auto transition-all duration-300"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 40px rgba(59, 130, 246, 0.5)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            <span>🎤</span>
            <span>Start Voice Assistant</span>
            <FileText className="w-5 h-5" />
          </motion.button>
          <p className="text-gray-400 mt-4 text-sm">
            Click on any service above or use voice commands to get started
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ServiceCategories;
