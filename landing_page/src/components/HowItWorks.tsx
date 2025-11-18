import React from "react";
import { motion } from "framer-motion";


const steps = [
    {
        title: "1. Explore Services",
        desc: "Browse through skilled individuals offering their expertise.",
    },
    {
        title: "2. Book a Slot",
        desc: "Choose a provider, discuss details and schedule your session.",
    },
    {
        title: "3. Connect & Enjoy",
        desc: "Get the support or service you booked — easy and reliable!",
    },
];


export default function HowItWorks() {
    return (
        <section id="how" className="py-28 px-8 bg-gray-50">
            <h3 className="text-4xl font-bold text-center mb-16">How It Works</h3>


            <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
                {steps.map((step, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        viewport={{ once: true }}
                        className="p-10 bg-white rounded-3xl shadow border border-gray-200 text-center"
                    >
                        <h4 className="text-2xl font-semibold mb-3">{step.title}</h4>
                        <p className="text-gray-700 text-lg">{step.desc}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}