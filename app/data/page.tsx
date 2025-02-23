"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Papa from "papaparse";
import { motion } from "framer-motion";

const csvPath = "/synthetic_calls_scenarios.csv";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
const SelectComponent = dynamic(() => import("react-select"), { ssr: false });

export default function Analysis() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [scenarios, setScenarios] = useState<string[]>([]);
    const [names, setNames] = useState<string[]>([]);
    const [selectedScenarios, setSelectedScenarios] = useState<string[]>(["All"]);
    const [selectedNames, setSelectedNames] = useState<string[]>(["All"]);
    const [selectedChart, setSelectedChart] = useState("Scenario Frequency");
    const [selectedPolarityChart, setSelectedPolarityChart] = useState("Sentiment Analysis");
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // New state to hold JSON call data
    const [jsonData, setJsonData] = useState<any[]>([]);

    useEffect(() => {
        // Fetch CSV data as before
        fetch(csvPath)
            .then((response) => response.text())
            .then((csvText) => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        setData(results.data);
                        setLoading(false);

                        const uniqueScenarios = [
                            ...new Set(results.data.map((row: any) => row["Phishing Scenario"]))
                        ].filter(Boolean);
                        const uniqueNames = [
                            ...new Set(results.data.map((row: any) => row["Name"]))
                        ].filter(Boolean);

                        setScenarios(uniqueScenarios);
                        setNames(uniqueNames);
                    },
                });
            })
            .catch((error) => {
                console.error("Error loading CSV:", error);
                setLoading(false);
            });

        // Fetch JSON call data for sentiment and keyword analysis
        fetch("/callData.json")
            .then((response) => response.json())
            .then((json) => {
                setJsonData(json);
            })
            .catch((error) => {
                console.error("Error loading JSON:", error);
            });
    }, []);

    const filteredData = data.filter((row) => {
        const scenarioMatch =
            selectedScenarios.includes("All") ||
            selectedScenarios.includes(row["Phishing Scenario"]);
        const nameMatch =
            selectedNames.includes("All") || selectedNames.includes(row["Name"]);
        return scenarioMatch && nameMatch;
    });

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const scenarioCounts = filteredData.reduce((acc: Record<string, number>, row) => {
        const scenario = row["Phishing Scenario"];
        acc[scenario] = (acc[scenario] || 0) + 1;
        return acc;
    }, {});

    const callLengths = filteredData
        .map((row) => parseFloat(row["Call Length (s)"]))
        .filter((n) => !isNaN(n));

    const responseCounts = filteredData.reduce((acc: Record<string, number>, row) => {
        const response = row["Response Description"];
        acc[response] = (acc[response] || 0) + 1;
        return acc;
    }, {});

    // Convert options for react-select
    const scenarioOptions = [
        { value: "All", label: "🌍 All Scenarios" },
        ...scenarios.map((s) => ({ value: s, label: s })),
    ];
    const nameOptions = [
        { value: "All", label: "👥 All Names" },
        ...names.map((n) => ({ value: n, label: n })),
    ];
    const chartOptions = [
        { value: "Scenario Frequency", label: "📈 Scenario Frequency" },
        { value: "Call Length Distribution", label: "📞 Call Length Distribution" },
        { value: "Response Type Distribution", label: "🎭 Response Type Distribution" },
        { value: "Top Responses", label: "💬 Top Responses" },
    ];
    const polarityChartOptions = [
        { value: "Sentiment Analysis", label: "💬 Sentiment Analysis" },
        { value: "Keyword Frequency", label: "🔑 Keyword Frequency" },
    ];

    const renderChart = () => {
        switch (selectedChart) {
            case "Scenario Frequency": {
                const sortedScenarios = Object.keys(scenarioCounts).sort();
                const sortedCounts = sortedScenarios.map(
                    (scenario) => scenarioCounts[scenario] || 0
                );
                return (
                    <Plot
                        data={[
                            {
                                type: "bar",
                                x: sortedScenarios,
                                y: sortedCounts,
                                marker: { color: "#36A2EB" },
                            },
                        ]}
                        layout={{
                            title: "📈 Scenario Frequency",
                            xaxis: {
                                title: "Scenario Type",
                                tickangle: -45,
                                showline: true,
                                showgrid: true,
                                zeroline: true,
                            },
                            yaxis: { title: "Count", showline: true, showgrid: true, zeroline: true },
                            bargap: 0.3,
                            autosize: true,
                            margin: { l: 50, r: 50, b: 100, t: 50, pad: 4 },
                        }}
                        style={{ width: "100%", height: "100%" }}
                        useResizeHandler={true}
                    />
                );
            }
            case "Call Length Distribution":
                return (
                    <Plot
                        data={[
                            {
                                type: "histogram",
                                x: callLengths,
                                marker: { color: "#FF5733", opacity: 0.6 },
                            },
                        ]}
                        layout={{
                            title: "📞 Call Length Distribution",
                            xaxis: {
                                title: "Call Length (seconds)",
                                showline: true,
                                showgrid: true,
                                zeroline: true,
                            },
                            yaxis: { title: "Frequency", showline: true, showgrid: true, zeroline: true },
                            bargap: 0.05,
                        }}
                    />
                );
            case "Response Type Distribution":
                return (
                    <Plot
                        data={[
                            {
                                type: "pie",
                                labels: Object.keys(responseCounts),
                                values: Object.values(responseCounts),
                                textinfo: "label+percent",
                                marker: {
                                    colors: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
                                },
                            },
                        ]}
                        layout={{ title: "🎭 Response Type Distribution" }}
                    />
                );
            case "Top Responses":
                return (
                    <Plot
                        data={[
                            {
                                type: "bar",
                                orientation: "h",
                                x: Object.values(responseCounts),
                                y: Object.keys(responseCounts),
                                marker: { color: "#4BC0C0" },
                                text: Object.values(responseCounts).map(String),
                                textposition: "outside",
                            },
                        ]}
                        layout={{
                            title: "💬 Top Response Types",
                            xaxis: {
                                title: "Count",
                                showline: true,
                                showgrid: true,
                                zeroline: true,
                            },
                            yaxis: {
                                title: "Response Type",
                                automargin: true,
                                showline: true,
                                showgrid: true,
                                zeroline: true,
                            },
                            margin: { l: 250 },
                        }}
                    />
                );
            default:
                return null;
        }
    };

    // New function to render JSON-based graphs for polarity analysis
    const renderPolarityChart = () => {
        if (!jsonData || jsonData.length === 0) return <div>Loading JSON charts...</div>;

        switch (selectedPolarityChart) {
            case "Sentiment Analysis": {
                // Calculate frequency counts of user sentiment from JSON call data
                const sentimentCounts = jsonData.reduce((acc: Record<string, number>, call) => {
                    const sentiment = call.call_analysis?.user_sentiment;
                    if (sentiment) {
                        acc[sentiment] = (acc[sentiment] || 0) + 1;
                    }
                    return acc;
                }, {});

                const sentiments = Object.keys(sentimentCounts);
                const counts = sentiments.map((sent) => sentimentCounts[sent]);

                return (
                    <Plot
                        data={[
                            {
                                type: "bar",
                                x: sentiments,
                                y: counts,
                                marker: { color: "#36A2EB" },
                            },
                        ]}
                        layout={{
                            title: "Sentiment Analysis",
                            xaxis: { title: "Sentiment" },
                            yaxis: { title: "Count" },
                            margin: { l: 50, r: 50, b: 50, t: 50 },
                        }}
                        style={{ width: "100%", height: "100%" }}
                        useResizeHandler={true}
                    />
                );
            }
            case "Keyword Frequency": {
                // Aggregate all transcripts from JSON call data
                const allText = jsonData.map((call) => call.transcript).join(" ");
                // Clean the text by removing punctuation and converting to lowercase
                const cleanedText = allText.replace(/[^\w\s]/gi, "").toLowerCase();
                const words = cleanedText.split(/\s+/);
                // Define simple stop words to ignore
                const stopWords = new Set([
                    "the", "and", "for", "a", "an", "of", "to", "in", "is", "it", "that",
                    "this", "with", "as", "on", "was", "but", "are", "i", "you", "we", "they",
                    "be", "have", "has", "or"
                ]);
                const wordCounts: Record<string, number> = {};
                words.forEach((word) => {
                    if (word && !stopWords.has(word)) {
                        wordCounts[word] = (wordCounts[word] || 0) + 1;
                    }
                });
                // Get top 10 most frequent words
                const sortedWords = Object.entries(wordCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10);
                const topWords = sortedWords.map(([word]) => word);
                const topCounts = sortedWords.map(([, count]) => count);

                return (
                    <Plot
                        data={[
                            {
                                type: "bar",
                                x: topWords,
                                y: topCounts,
                                marker: { color: "#FF5733" },
                            },
                        ]}
                        layout={{
                            title: "Keyword Frequency",
                            xaxis: { title: "Keywords" },
                            yaxis: { title: "Frequency" },
                            margin: { l: 50, r: 50, b: 100, t: 50 },
                        }}
                        style={{ width: "100%", height: "100%" }}
                        useResizeHandler={true}
                    />
                );
            }
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
          <span className="px-4 py-1.5 text-sm font-medium rounded-full bg-blue-50 text-blue-600 inline-block border border-blue-100 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
            Data Analysis
          </span>
                    <h1 className="text-4xl md:text-6xl font-bold mt-6 bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent leading-[1.1] md:leading-[1.2] pb-1">
                        Phishing Call Analytics
                    </h1>
                    <p className="text-lg mt-4 max-w-2xl mx-auto text-gray-600">
                        Analyze employee responses to internal phishing campaign calls, helping identify training needs and strengthen organizational security
                    </p>
                </motion.div>

                {/* Filters Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="grid lg:grid-cols-2 gap-6 mb-8"
                >
                    <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Filter Data</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Scenarios</label>
                                <SelectComponent
                                    options={scenarioOptions}
                                    isMulti
                                    value={scenarioOptions.filter((opt) => selectedScenarios.includes(opt.value))}
                                    onChange={(selected: any) => {
                                        const values = selected.map((opt: any) => opt.value);
                                        setSelectedScenarios(values.includes("All") ? ["All"] : values);
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Names</label>
                                <SelectComponent
                                    options={nameOptions}
                                    isMulti
                                    value={nameOptions.filter((opt) => selectedNames.includes(opt.value))}
                                    onChange={(selected: any) => {
                                        const values = selected.map((opt: any) => opt.value);
                                        setSelectedNames(values.includes("All") ? ["All"] : values);
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Visualization Options</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
                                <SelectComponent
                                    options={chartOptions}
                                    onChange={(selected: any) => setSelectedChart(selected?.value || "Scenario Frequency")}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Polarity Analysis</label>
                                <SelectComponent
                                    options={polarityChartOptions}
                                    onChange={(selected: any) => setSelectedPolarityChart(selected?.value || "Sentiment Analysis")}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Charts Section */}
                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="p-6 rounded-2xl border border-gray-200 bg-white shadow-lg"
                    >
                        <h2 className="text-xl font-semibold mb-4">Call Analytics</h2>
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            renderChart()
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="p-6 rounded-2xl border border-gray-200 bg-white shadow-lg"
                    >
                        <h2 className="text-xl font-semibold mb-4">Polarity Analysis</h2>
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            renderPolarityChart()
                        )}
                    </motion.div>
                </div>

                {/* Data Table Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="p-6 rounded-2xl border border-gray-200 bg-white shadow-lg"
                >
                    <h2 className="text-lg font-semibold mb-2 text-black">Filtered Data</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-300 text-black">
                            <thead>
                            <tr className="bg-gray-200 text-black">
                                <th className="border p-2">Name</th>
                                <th className="border p-2">Scenario</th>
                                <th className="border p-2">Call Length (s)</th>
                                <th className="border p-2">Response</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginatedData.map((row, index) => (
                                <tr key={index} className="border text-black">
                                    <td className="border p-2">{row["Name"]}</td>
                                    <td className="border p-2">{row["Phishing Scenario"]}</td>
                                    <td className="border p-2">{row["Call Length (s)"]}</td>
                                    <td className="border p-2">{row["Response Description"]}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex justify-between items-center mt-4">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 text-white rounded ${
                                currentPage === 1 ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-700"
                            }`}
                        >
                            ◀ Previous
                        </button>
                        <span className="text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 text-white rounded ${
                                currentPage === totalPages ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-700"
                            }`}
                        >
                            Next ▶
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}