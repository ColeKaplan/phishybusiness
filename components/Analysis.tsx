"use client";

import { useEffect, useState } from "react";

interface CallDetails {
    transcript: string;
}

type PhishingAnalysis = {
    mistakes: string[];
    risks: string[];
    bestPractices: string[];
};

const Analysis = ({ callDetails }: { callDetails: CallDetails }) => {

    const [aiResponse, setAIResponse] = useState<PhishingAnalysis | null>(null);

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        console.log("we are in the useeffect again")
        getAnalysis(callDetails.transcript);
    }, []);

    async function getAnalysis(transcript: string) {
        setIsLoading(true);
        try {
            const response = await fetch("/api", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ transcript }),
            });

            const text = await response.text(); // Get the raw response text
            console.log(text)

            if (response.ok) {
                const parsedOuter = JSON.parse(text); // First parse
                const jsonData: PhishingAnalysis = JSON.parse(parsedOuter.response);
                setAIResponse(jsonData);
            } else {
                setAIResponse({ mistakes: [], risks: [], bestPractices: [] });
            }
        } catch (error) {
            console.error("Error generating analysis:", error);
            setAIResponse({ mistakes: [], risks: [], bestPractices: [] });
        } finally {
            setIsLoading(false);
        }
    }


    return (
        <>
            {!isLoading &&
                <div className="space-y-4">
                    <pre className="text-sm overflow-auto pr-4 rounded-lg whitespace-pre-wrap">
                        {/* {(aiResponse && JSON.stringify(aiResponse))|| "null"} */}
                        <div className="relative flex items-start justify-between flex-col space-y-2">
                            <h2 className=" text-lg underline">Phishing Analysis Report</h2>
                            <div>
                                <h3 className="text-[#000000]">Mistakes Made</h3>
                                <ul>
                                    {aiResponse?.mistakes.map((m, index) => (
                                        <li key={index}>- {m}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="h-px bg-gray-400 w-full"></div>

                            <div>
                                <h3 className="text-[#000000]">Potential Risks</h3>
                                <ul>
                                    {aiResponse?.risks.map((r, index) => (
                                        <li key={index}>- {r}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="h-px bg-gray-400 w-full"></div>

                            <div>
                                <h3 className="text-[#000000]">Best Practices</h3>
                                <ul>
                                    {aiResponse?.bestPractices.map((b, index) => (
                                        <li key={index}>- {b}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </pre>
                    {/* <button
                // onClick={() => getAnalysis(callDetails.transcript)}
                onClick={() => getAnalysis("Agent: Hello, is this Bob? \n User: Yes this is Bob, here is my social security number 994128442")}
                disabled={isLoading}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                {isLoading ? "Analyzing..." : "Analyze Transcript"}
            </button> */}
                </div>}

            {isLoading &&
                <div>
                    <p>Analyzing</p>

                </div>

            }
        </>
    );
};
export default Analysis;