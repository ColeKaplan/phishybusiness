import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import re
import numpy as np
from textblob import TextBlob
from scipy.stats import pointbiserialr

# --- Example Transcripts ---
transcripts = [
    """Transcript #1:
scammer: Hello, this is Officer Daniels from the fraud department. There has been suspicious activity on your account.
victim: Suspicious activity? What kind?
scammer: We detected multiple failed login attempts from an unrecognized device. We need to verify your identity.
victim: Oh no, what do I need to do?
scammer: Please confirm your full name and last four digits of your Social Security Number.
victim: My name is John Doe, and the last four of my SSN are 1234.
scammer: Thank you. Now, I need to reset your password. Please provide your old password.
victim: I don’t feel comfortable sharing that.
scammer: Without it, we can’t secure your account. Do you want to risk unauthorized access?
victim: Let me call my bank first.
scammer: That’s not necessary. I am your bank’s fraud investigator.
victim: I’ll check anyway. *[victim hangs up]*
""",
    """Transcript #2:
scammer: This is Amazon Security. Someone tried to make a $1,200 purchase on your account.
victim: What?! I didn’t authorize that!
scammer: We thought so. We’ve frozen your account temporarily. Please confirm your email and billing address so we can remove the fraudulent transaction.
victim: My email is janesmith@example.com, and my billing address is 123 Oak Street, Springfield.
scammer: Thank you. Now, just verify your credit card number so we can process the refund.
victim: Wait… why do you need my card number if you already have it?
scammer: For verification. If we don’t confirm, the charge may go through.
victim: I’ll check my Amazon account first. *[victim refuses further information]*
""",
    """Transcript #3:
scammer: Good afternoon, this is Michael from Microsoft Support. We detected a virus on your computer.
victim: A virus? That sounds bad.
scammer: Yes, your system has been compromised. Hackers can steal your personal data. We need to install a security patch.
victim: Okay… what do I need to do?
scammer: Download remote access software so I can remove the virus. Then, provide me with your system’s admin password.
victim: I don’t know if I should do that.
scammer: If you don’t, hackers may steal your passwords and banking details.
victim: Let me check with my IT guy first.
scammer: Your IT guy doesn’t have the specialized Microsoft tools I do.
victim: I’ll take my chances. *[victim hangs up]*
""",
    """Transcript #4:
scammer: Hello, this is Bank of America. There has been a suspicious transaction of $950 on your account.
victim: That’s not mine! What can I do?
scammer: We need to cancel it. First, confirm your online banking username and password.
victim: I don’t think I should do that.
scammer: Without verification, we cannot stop the transaction. You might lose the money.
victim: Let me log in to my account and check.
scammer: If you log in now, the hacker may see your activity.
victim: I’ll call the bank directly. *[victim ends call]*
""",
    """Transcript #5:
scammer: Congratulations! You’ve won a $1,000 Walmart gift card.
victim: Really? I don’t remember entering a contest.
scammer: Your number was randomly selected! You just need to cover a $4.99 shipping fee.
victim: That sounds suspicious.
scammer: Many customers have received their prize. We just need your credit card details for the shipping charge.
victim: I don’t think I’ll do that.
scammer: Are you sure? This offer expires in 10 minutes.
victim: I’ll pass. *[victim declines]*
""",
    """Transcript #6:
scammer: This is Sarah from PayPal. A $500 transfer was attempted from your account.
victim: I didn’t authorize that!
scammer: I can cancel it, but I need to verify your account information.
victim: What do you need?
scammer: Just your email and PayPal password.
victim: I’ll check my account first.
scammer: You might be locked out by then.
victim: I’ll take my chances. *[victim logs into PayPal and sees no suspicious activity]*
""",
    """Transcript #7:
scammer: This is the IRS. You have unpaid taxes and will be arrested if you don’t resolve this now.
victim: What?! I don’t want to go to jail.
scammer: We can settle this if you make a payment right now using gift cards.
victim: The IRS takes gift cards?
scammer: Yes, it’s our emergency processing system.
victim: I don’t believe you. *[victim hangs up]*
""",
    """Transcript #8:
scammer: Hi, this is Apple Support. Your iCloud account has been breached.
victim: That’s scary.
scammer: We need to secure your account. Please provide your Apple ID and password.
victim: I’ll reset my password myself.
scammer: That might not work. I need to do it from my end.
victim: I’ll check with Apple first.
scammer: There’s no time. Hackers are already in your account.
victim: I’ll take the risk. *[victim refuses]*
""",
    """Transcript #9:
scammer: This is FedEx. A package under your name was intercepted due to suspicious contents.
victim: What package?
scammer: Authorities are investigating, but you can clear your name by verifying your identity.
victim: What do you need?
scammer: Your full name, date of birth, and Social Security Number.
victim: I never ordered anything.
scammer: Maybe someone used your identity.
victim: I’ll check with FedEx first. *[victim refuses]*
""",
    """Transcript #10:
scammer: This is John from the FBI. You are under investigation for money laundering.
victim: What?! I didn’t do anything wrong!
scammer: We need to confirm your identity before taking further action.
victim: How?
scammer: Provide your Social Security Number and bank account details.
victim: I think I need a lawyer.
scammer: That will make you look guilty.
victim: I don’t care. *[victim hangs up]*
"""
]

# --- Aggregate Transcripts into a DataFrame ---
all_data = []
for t_id, transcript in enumerate(transcripts):
    lines = [line.strip() for line in transcript.split('\n') if line.strip()]
    for line in lines:
        if ':' in line:
            speaker, message = line.split(':', 1)
            all_data.append({
                'transcript_id': t_id,
                'speaker': speaker.strip().lower(),
                'message': message.strip()
            })

df_all = pd.DataFrame(all_data)

df_all.to_csv("scam_transcripts.csv", index=False)

# --- Compute Polarity for Each Message ---
def compute_polarity(text):
    blob = TextBlob(text)
    return blob.sentiment.polarity

df_all['polarity'] = df_all['message'].apply(compute_polarity)

# --- Detect Sensitive Information in Victim Messages ---
sensitive_keywords = {
    "ssn": ["ssn", "social security"],
    "password": ["password"],
    "credit card": ["credit card", "card number"],
    "billing address": ["billing address", "address"]
}

def detect_sensitive_info(text):
    found = []
    text_lower = text.lower()
    for key, keywords in sensitive_keywords.items():
        for kw in keywords:
            if kw in text_lower:
                found.append(key)
                break
    return found

df_victim = df_all[df_all['speaker'] == 'victim'].copy()
df_victim['sensitive_info'] = df_victim['message'].apply(detect_sensitive_info)
df_victim['sensitive_given'] = df_victim['sensitive_info'].apply(lambda x: 1 if len(x) > 0 else 0)

# --- Visualizations for Victim Sensitive Information ---
all_sensitive = []
for info_list in df_victim['sensitive_info']:
    all_sensitive.extend(info_list)
info_counter = pd.Series(all_sensitive).value_counts()

if not info_counter.empty:
    plt.figure(figsize=(8, 4))
    bars = plt.bar(info_counter.index, info_counter.values, color='lightcoral')
    plt.xlabel("Sensitive Information Type")
    plt.ylabel("Count")
    plt.title("Sensitive Information Given Up (Bar Chart)")
    plt.xticks(rotation=45, ha="right")
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, yval + 0.1, int(yval), ha='center', va='bottom')
    plt.tight_layout()
    plt.show()

if not info_counter.empty:
    plt.figure(figsize=(6, 6))
    plt.pie(info_counter.values, labels=info_counter.index, autopct='%1.1f%%', startangle=140, colors=plt.cm.Pastel1.colors)
    plt.title("Sensitive Information Distribution (Pie Chart)")
    plt.axis('equal')
    plt.show()

# --- Aggregate Data per Transcript for Correlation Analysis ---
victim_agg = df_victim.groupby('transcript_id')['sensitive_given'].max().reset_index()

df_scammer = df_all[df_all['speaker'] == 'scammer'].copy()
scammer_agg = df_scammer.groupby('transcript_id')['polarity'].mean().reset_index()
scammer_agg.rename(columns={'polarity': 'avg_scammer_polarity'}, inplace=True)

df_corr = pd.merge(scammer_agg, victim_agg, on='transcript_id', how='left')
df_corr['sensitive_given'] = df_corr['sensitive_given'].fillna(0)

print("Aggregated Data per Transcript:")
print(df_corr)

# --- Compute Point-Biserial Correlation ---
corr_coef, p_value = pointbiserialr(df_corr['sensitive_given'], df_corr['avg_scammer_polarity'])
print("Point-biserial correlation coefficient:", corr_coef)
print("P-value:", p_value)

# --- Modified Boxplot: Compare scammer polarity distributions for transcripts where victim did vs. did not give sensitive info ---
data_no = df_corr[df_corr['sensitive_given'] == 0]['avg_scammer_polarity']
data_yes = df_corr[df_corr['sensitive_given'] == 1]['avg_scammer_polarity']

plt.figure(figsize=(8, 6))
plt.boxplot([data_no, data_yes], labels=['No Sensitive Info', 'Sensitive Info'])
plt.xlabel("Victim Sensitive Disclosure")
plt.ylabel("Average Scammer Polarity")
plt.title("Scammer Polarity by Victim Sensitive Info")
plt.show()

# --- New Graph: Comparison of Average Polarity (Victim vs. Scammer) per Transcript ---
# Aggregate average victim polarity per transcript.
victim_polarity_agg = df_all[df_all['speaker'] == 'victim'].groupby('transcript_id')['polarity'].mean().reset_index()
victim_polarity_agg.rename(columns={'polarity': 'avg_victim_polarity'}, inplace=True)

# Merge with scammer polarity aggregation.
merged_pol = pd.merge(scammer_agg, victim_polarity_agg, on='transcript_id', how='outer')

# Create grouped bar chart.
ind = np.arange(len(merged_pol))  # transcript indices
width = 0.35

plt.figure(figsize=(10, 6))
plt.bar(ind - width/2, merged_pol['avg_scammer_polarity'], width, label='Scammer', color='blue')
plt.bar(ind + width/2, merged_pol['avg_victim_polarity'], width, label='Victim', color='green')
plt.xlabel("Transcript ID")
plt.ylabel("Average Polarity")
plt.title("Average Polarity Comparison per Transcript: Scammer vs. Victim")
plt.xticks(ind, merged_pol['transcript_id'])
plt.legend()
plt.tight_layout()
plt.show()

# 1. Histograms/KDE Plots for Polarity Distributions

plt.figure(figsize=(8,6))
sns.histplot(df_all[df_all['speaker']=='scammer']['polarity'], bins=20, kde=True, color='blue')
plt.title("Scammer Polarity Distribution")
plt.xlabel("Polarity")
plt.ylabel("Frequency")
plt.show()

plt.figure(figsize=(8,6))
sns.histplot(df_all[df_all['speaker']=='victim']['polarity'], bins=20, kde=True, color='green')
plt.title("Victim Polarity Distribution")
plt.xlabel("Polarity")
plt.ylabel("Frequency")
plt.show()


# 2. Violin Plot Comparing Polarity Distributions for Scammer vs. Victim
combined_df = df_all[df_all['speaker'].isin(['scammer', 'victim'])].copy()
plt.figure(figsize=(8,6))
sns.violinplot(x='speaker', y='polarity', data=combined_df, palette={'scammer':'blue','victim':'green'})
plt.title("Violin Plot of Polarity by Speaker")
plt.xlabel("Speaker")
plt.ylabel("Polarity")
plt.show()


# Compute message order for each transcript
df_all['msg_order'] = df_all.groupby('transcript_id').cumcount() + 1


# 4. Correlation Heatmap among Aggregated Transcript Metrics
# Compute aggregated victim stats: average victim polarity and number of victim messages per transcript.
victim_stats = df_victim.groupby('transcript_id').agg({
    'polarity': ['mean', 'count']
})
victim_stats.columns = ['avg_victim_polarity', 'num_victim_msgs']
victim_stats = victim_stats.reset_index()

# Assume scammer_agg (average scammer polarity) and victim_agg (binary sensitive_given) are computed.
# For example:
scammer_agg = df_scammer.groupby('transcript_id')['polarity'].mean().reset_index()
scammer_agg.rename(columns={'polarity':'avg_scammer_polarity'}, inplace=True)
victim_agg = df_victim.groupby('transcript_id')['sensitive_given'].max().reset_index()

# Merge all aggregated data.
agg_df = pd.merge(scammer_agg, victim_stats, on='transcript_id', how='outer')
agg_df = pd.merge(agg_df, victim_agg, on='transcript_id', how='outer')
agg_df['sensitive_given'] = agg_df['sensitive_given'].fillna(0)

# Select variables to correlate.
corr_vars = agg_df[['avg_scammer_polarity', 'avg_victim_polarity', 'num_victim_msgs', 'sensitive_given']]
corr_matrix = corr_vars.corr()

plt.figure(figsize=(8,6))
sns.heatmap(corr_matrix, annot=True, cmap="coolwarm", vmin=-1, vmax=1)
plt.title("Correlation Heatmap of Aggregated Metrics")
plt.show()


# 5. Scatter Plot with Jitter for Victim Sensitive Info vs. Average Scammer Polarity
plt.figure(figsize=(8,6))
jitter = np.random.uniform(-0.05, 0.05, size=len(df_corr))
plt.scatter(df_corr['avg_scammer_polarity'], df_corr['sensitive_given'] + jitter, color='purple', alpha=0.7)
plt.xlabel("Average Scammer Polarity per Transcript")
plt.ylabel("Victim Gave Sensitive Info (0 = No, 1 = Yes, with jitter)")
plt.title("Scatter Plot with Jitter: Scammer Polarity vs. Victim Sensitive Info")
plt.axhline(0, color='grey', linestyle='--')
plt.grid(True)
plt.show()