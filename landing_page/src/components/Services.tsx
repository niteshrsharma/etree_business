import React from "react";
import { motion } from "framer-motion";
import { FaGuitar, FaUserFriends, FaHandsHelping } from "react-icons/fa";


const services = [
    {
        title: "Artists & Performers",
        desc: "Hire singers, musicians, photographers and entertainers for events.",
        icon: <FaGuitar size={50} />,
    },
    {
        title: "Community Support",
        desc: "Find companions or helpers for elders, daily needs and support.",
        icon: <FaUserFriends size={50} />,
    },
    {
        title: "Skilled Professionals",
        desc: "Connect with skilled individuals offering unique services.",
        icon: <FaHandsHelping size={50} />,
    },
];


export default function Services() {
    return (
        <section id="services" className="py-28 px-8 bg-white">
            <h3 className="text-4xl font-bold text-center mb-16">What We Offer</h3>


            <div className="grid md:grid-cols-3 gap-10 max-w-7xl mx-auto">
                {services.map((s, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        viewport={{ once: true }}
                        className="bg-gray-50 p-10 rounded-3xl shadow hover:shadow-2xl transition-all text-center border border-gray-200"
                    >
                        <div className="flex justify-center mb-6 text-blue-600">{s.icon}</div>
                        <h4 className="text-2xl font-semibold mb-3">{s.title}</h4>
                        <p className="text-gray-700 text-lg">{s.desc}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}