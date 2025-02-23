"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Papa from "papaparse";

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
    const [selectedPolarityChart, setSelectedPolarityChart] = useState("Average Polarity Comparison");
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    useEffect(() => {
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
                            ...new Set(
                                results.data.map((row: any) => row["Phishing Scenario"])
                            ),
                        ].filter(Boolean);
                        const uniqueNames = [
                            ...new Set(results.data.map((row: any) => row["Name"])),
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

    const polarityValues = filteredData
        .map((row) => parseFloat(row["Polarity"])) // Assumes "Polarity" column exists
        .filter((n) => !isNaN(n));

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
        { value: "Average Polarity Comparison", label: "⚖️ Average Polarity Comparison" },
        { value: "Scammer Polarity Distribution", label: "🕵️‍♂️ Scammer Polarity Distribution" },
        { value: "Scammer Polarity Box Plots", label: "📊 Scammer Polarity Box Plots" },
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
                        }}
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

    const renderPolarityChart = () => {
        switch (selectedPolarityChart) {
            case "Average Polarity Comparison":
                return (
                    <div>
                        {/* Replace with PNG */}
                        <img src="/AveragePolarityComparison.png" alt="Average Polarity Comparison" className="w-full" />
                    </div>
                );
            case "Scammer Polarity Distribution":
                return (
                    <div>
                        {/* Replace with PNG */}
                        <img src="/ScammerPolaritDistribution.png" alt="Scammer Polarity Distribution" className="w-full" />
                    </div>
                );
            case "Scammer Polarity Box Plots":
                return (
                    <div>
                        {/* Replace with PNG */}
                        <img src="/ScammerPolarityBox.png" alt="Scammer Polarity Box Plots" className="w-full" />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 p-8 space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 mt-10">
                📊 Phishing Scenario Analysis
            </h1>

            {/* Filters */}
            <div className="w-full max-w-4xl bg-white p-4 rounded-xl shadow-lg flex flex-col space-y-4">
                <label className="block text-gray-700 font-semibold">Filter by Scenario:</label>
                <SelectComponent
                    options={scenarioOptions}
                    isMulti
                    value={scenarioOptions.filter((opt) => selectedScenarios.includes(opt.value))}
                    placeholder="Select scenarios..."
                    onChange={(selected : any) => {
                        const values = selected.map((opt : any) => opt.value);
                        setSelectedScenarios(values.includes("All") ? ["All"] : values);
                    }}
                    className="mt-2"
                />

                <label className="block text-gray-700 font-semibold">Filter by Name:</label>
                <SelectComponent
                    options={nameOptions}
                    isMulti
                    value={nameOptions.filter((opt) => selectedNames.includes(opt.value))}
                    placeholder="Select names..."
                    onChange={(selected : any) => {
                        const values = selected.map((opt : any) => opt.value);
                        setSelectedNames(values.includes("All") ? ["All"] : values);
                    }}
                    className="mt-2"
                />

                <label className="block text-gray-700 font-semibold">Select Chart:</label>
                <SelectComponent
                    options={chartOptions}
                    placeholder="Choose a chart..."
                    onChange={(selected : any) =>
                        setSelectedChart(selected?.value || "Scenario Frequency")
                    }
                    className="mt-2"
                />

                <label className="block text-gray-700 font-semibold">Select Polarity Chart:</label>
                <SelectComponent
                    options={polarityChartOptions}
                    placeholder="Choose a polarity chart..."
                    onChange={(selected : any) =>
                        setSelectedPolarityChart(selected?.value || "Average Polarity Comparison")
                    }
                    className="mt-2"
                />
            </div>

            {/* Graph for selected chart */}
            <div className="w-full max-w-4xl bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 text-black"> 🌍 Aggregate Graph </h2>
                {loading ? (
                    <p className="text-gray-500">Loading CSV data...</p>
                ) : (
                    renderChart()
                )}
            </div>

            {/* Polarity Analysis as Separate Graph */}
            <div className="w-full max-w-4xl bg-white p-6 rounded-xl shadow-lg mt-6">
                <h2 className="text-2xl font-semibold mb-4 text-black">🔮 Polarity Analysis</h2>
                {loading ? (
                    <p className="text-gray-500">Loading CSV data...</p>
                ) : (
                    renderPolarityChart()
                )}
            </div>

            {/* Paginated Table */}
            <div className="w-full max-w-4xl bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-lg font-semibold mb-2 text-black">📋 Filtered Data</h2>
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
                            currentPage === 1
                                ? "bg-gray-400"
                                : "bg-blue-500 hover:bg-blue-700"
                        }`}
                    >
                        ◀ Previous
                    </button>
                    <span className="text-gray-700">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() =>
                            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                        }
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 text-white rounded ${
                            currentPage === totalPages
                                ? "bg-gray-400"
                                : "bg-blue-500 hover:bg-blue-700"
                        }`}
                    >
                        Next ▶
                    </button>
                </div>
            </div>
        </div>
    );
}