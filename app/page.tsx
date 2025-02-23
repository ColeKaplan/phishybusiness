"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Phone, UserCheck, ChevronDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import StatsSection from "@/components/StatsSection";
import Analysis from "@/components/Analysis";
const data = [
  { year: "2019", value: 1.5 },
  { year: "2020", value: 2.1 },
  { year: "2021", value: 2.8 },
  { year: "2022", value: 3.3 },
  { year: "2023", value: 3.9 },
];
export default function Home() {
  const [userName, setUserName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [agentID, setAgentID] = useState("agent_a5731a34565ef2b5c883c25add");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [callDetails, setCallDetails] = useState<any>(null);

  async function callUser() {
    setError(null);
    setSuccess(false);
    setCallDetails(null);

    if (!userName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!phoneNumber.match(/^\+1\d{10}$/)) {
      setError("Please enter a valid phone number (+1 followed by 10 digits)");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        "https://api.retellai.com/v2/create-phone-call",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_RETELL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from_number: "+16509551950",
            to_number: phoneNumber,
            override_agent_id: agentID,
            retell_llm_dynamic_variables: {
              name: userName,
            },
            // webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook`,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to initiate call");
      }
      setSuccess(true);
      console.log("Call initiated:", data);

      pollCallStatus(data.call_id);
    } catch (error) {
      console.error("Error making call:", error);
      setError("Failed to initiate call. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const pollCallStatus = async (callId: string) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(
          `https://api.retellai.com/v2/get-call/${callId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_RETELL_API_KEY}`,
            },
          }
        );
        const data = await response.json();

        if (data.call_status === "ended") {
          setCallDetails(data);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error checking call status:", error);
        return true;
      }
    };

    const pollInterval = setInterval(async () => {
      const shouldStop = await checkStatus();
      if (shouldStop) {
        clearInterval(pollInterval);
      }
    }, 5000);

    setTimeout(() => clearInterval(pollInterval), 30 * 60 * 1000);
  };

  return (
    <div className="min-h-screen ">
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="px-4 py-1.5 text-sm font-medium rounded-full bg-blue-50 text-blue-600 inline-block border border-blue-100 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
              Protect Your Loved Ones
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mt-6 bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent leading-[1.1] md:leading-[1.2] pb-1">
              Defending Against Phone Scams
            </h1>
            <p className="text-lg mt-4 max-w-2xl mx-auto text-gray-600">
              Every year, thousands of people fall victim to phone scams. We're
              here to help protect your loved ones through education and
              awareness.
            </p>
            {/* <Analysis callDetails={callDetails}/> */}
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative p-8 rounded-2xl border border-gray-200 bg-white/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-2xl"></div>
              <div className="relative flex flex-col gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium mb-2"
                  >
                    Your Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-black focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium mb-2"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="Enter phone number (+1XXXXXXXXXX)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-black focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Format: +1 followed by your 10-digit number
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="relationship"
                    className="block text-sm font-medium mb-2"
                  >
                    Scam Options
                  </label>
                  <select
                    id="scamType"
                    onChange={(e) => setAgentID(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-black focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200"
                  >
                    <option value="agent_a90a3d0b6f138a877d345e4e44">Select Scam</option>
                    <option value="agent_a90a3d0b6f138a877d345e4e44">Social Security</option>
                    <option value="agent_a5731a34565ef2b5c883c25add">Bank Account</option>
                    {/* <option value="credit_card">Raffle Winner</option>
                    <option value="credit_card">Charity</option>
                    <option value="tech_support">Tech Support</option> */}
                  </select>
                </div>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                {success && !callDetails && (
                  <div className="mt-4 w-full">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-50 border border-green-100 shadow-sm w-full animate-pulse">
                      <div className="flex items-center w-full">
                        <div className="animate-pulse mr-2 h-2 w-2 rounded-full bg-green-500"></div>
                        <p className="text-green-700 text-sm font-medium">
                          Call in progress. A detailed analysis will be provided
                          once completed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => callUser()}
                  disabled={isLoading}
                  className="w-full px-4 py-3 mt-4 rounded-lg transition-colors duration-200 bg-black text-white hover:bg-black/90 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Initiating Call...
                    </>
                  ) : (
                    "Start Educational Call"
                  )}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {!callDetails ? (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  animate={{ opacity: !callDetails ? 1 : 0 }}
                >
                  <StatsSection />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 rounded-2xl border border-gray-200 bg-white/50 backdrop-blur-sm shadow-xl"
                >
                  <Analysis callDetails={callDetails}/>
                </motion.div>
              )}
            </motion.div>
          </div>
          {/* <div className="h-[400px] p-6 rounded-xl border border-gray-200">
            <h3 className="text-xl font-semibold mb-4 text-center">
              Phone Scam Reports (Millions)
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="year" stroke="rgba(0,0,0,0.6)" />
                <YAxis stroke="rgba(0,0,0,0.6)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0066FF"
                  strokeWidth={2}
                  dot={{ fill: "#0066FF", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div> */}

          <section className="grid md:grid-cols-3 gap-8 mb-16"></section>

          <section className="w-full max-w-5xl mx-auto mt-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-600">
                Everything you need to know about our scam prevention service
              </p>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg">
                <button
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
                >
                  <span className="text-lg font-medium">
                    Is this service free?
                  </span>
                  <motion.span
                    animate={{ rotate: openFaq === 1 ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  </motion.span>
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openFaq === 1 ? "auto" : 0,
                    opacity: openFaq === 1 ? 1 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4 text-gray-600 mt-3">
                    Yes, our educational scam prevention service is completely
                    free. We believe everyone deserves to be protected from
                    phone scams, which is why we've made this service accessible
                    to all.
                  </div>
                </motion.div>
              </div>

              <div className="border border-gray-200 rounded-lg">
                <button
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setOpenFaq(openFaq === 2 ? null : 2)}
                >
                  <span className="text-lg font-medium">How does it work?</span>
                  <motion.span
                    animate={{ rotate: openFaq === 2 ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  </motion.span>
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openFaq === 2 ? "auto" : 0,
                    opacity: openFaq === 2 ? 1 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4 text-gray-600 mt-3">
                    We make a controlled, educational call that simulates common
                    scam tactics. During and after the call, we provide guidance
                    on identifying red flags and best practices for handling
                    suspicious calls. This hands-on approach helps build
                    practical experience in a safe environment.
                  </div>
                </motion.div>
              </div>

              <div className="border border-gray-200 rounded-lg">
                <button
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setOpenFaq(openFaq === 3 ? null : 3)}
                >
                  <span className="text-lg font-medium">
                    Is my information secure?
                  </span>
                  <motion.span
                    animate={{ rotate: openFaq === 3 ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  </motion.span>
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openFaq === 3 ? "auto" : 0,
                    opacity: openFaq === 3 ? 1 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4 text-gray-600 mt-3">
                    Absolutely. We take data privacy seriously. Your personal
                    information is encrypted and never shared with third
                    parties. We only use your contact details for the
                    educational call you requested.
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
