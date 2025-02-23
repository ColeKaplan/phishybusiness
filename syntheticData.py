from faker import Faker
import random
import pandas as pd

fake = Faker()


def generate_synthetic_calls(num_calls=3000, filename="synthetic_calls.csv"):
    data = []

    for _ in range(num_calls):
        name = fake.name()
        phone_number = fake.numerify("(###) ###-####")
        response_description = random.choice([
            "Hung up immediately",
            "Asked questions but didn't share info",
            "Shared sensitive information",
            "Was skeptical but continued conversation",
            "Ignored the call"
        ])
        gave_information = response_description == "Shared sensitive information"
        call_length = round(random.uniform(5, 300), 2)
        phishing_scenario = random.choice([
            "Bank Fraud",
            "Tech Support Scam",
            "IRS/Tax Scam",
            "Prize Scam"
        ])

        data.append({
            "Name": name,
            "Phone Number": phone_number,
            "Response Description": response_description,
            "Gave Information": gave_information,
            "Call Length (s)": call_length,
            "Phishing Scenario": phishing_scenario
        })

    df = pd.DataFrame(data)
    df.to_csv(filename, index=False)
    print(f"Dataset saved as {filename}")

    return df



df = generate_synthetic_calls(3000, "synthetic_calls_scenarios.csv")

print(df.head())