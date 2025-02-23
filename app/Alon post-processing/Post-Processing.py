import pandas as pd
import matplotlib.pyplot as plt
import re
from collections import Counter
from textblob import TextBlob

# --- Example Transcript String ---
transcript_string = """
scammer: Hello, this is the fraud prevention department from your bank.
victim: Hi, I'm a bit confused. What's going on with my account?
scammer: We have detected unusual activity. To verify your identity, please confirm your full name, account number, and address.
victim: My name is John Doe, my account number is 123456789, and my address is 123 Maple Street, Springfield.
scammer: Thank you, John. For further verification, we need your date of birth and social security number.
victim: Sure, my date of birth is 01/01/1980 and my social security number is 123-45-6789.
scammer: To secure your account, please also provide your credit card details including the card number, expiry date, and CVV.
victim: Alright, my credit card number is 4111111111111111, it expires on 12/25, and the CVV is 123.
scammer: Lastly, to reset your online banking session, please confirm your login credentials including your username and password.
victim: My username is johndoe80 and my password is securePass!2025.
scammer: Thank you, John. We are securing your account now.
"""

# --- Parsing the Transcript ---
lines = [line.strip() for line in transcript_string.strip().split('\n') if line.strip()]
data = []
for line in lines:
    if ':' in line:
        speaker, message = line.split(':', 1)
        data.append({'speaker': speaker.strip().lower(), 'message': message.strip()})
df = pd.DataFrame(data)
print("Parsed Transcript DataFrame:")
print(df)

# =====================
# Part 1: Analyze Victim's Sensitive Information and Sentiment
# =====================

# Define sensitive keywords for different information types
sensitive_keywords = {
    "bank account": ["account number", "routing number", "bank"],
    "credit card": ["credit card", "card number", "cvv", "expiry"],
    "login credentials": ["password", "username", "login", "pin"],
    "personal identification": ["social security", "ssn", "passport", "id"],
    "address": ["address", "street", "city", "zip code"],
    "phone number": ["phone", "mobile"],
    "email": ["email", "e-mail"],
    "date of birth": ["date of birth", "dob", "birthdate"]
}

def detect_sensitive_info(text):
    found_info = set()
    text_lower = text.lower()
    for info_type, keywords in sensitive_keywords.items():
        for keyword in keywords:
            if keyword in text_lower:
                found_info.add(info_type)
                break  # Found one keyword for this type; move on.
    return list(found_info)

# Filter victim messages
df_victim = df[df['speaker'] == 'victim'].copy()
df_victim['sensitive_info'] = df_victim['message'].apply(detect_sensitive_info)
df_victim['word_count'] = df_victim['message'].apply(lambda text: len(re.findall(r'\w+', text)))
df_victim['sensitive_info_count'] = df_victim['sensitive_info'].apply(len)

print("\nSensitive Information Provided by the Victim (per message):")
print(df_victim[['message', 'sensitive_info']])

# Aggregate sensitive info across victim messages
aggregated_info = []
for info_list in df_victim['sensitive_info']:
    aggregated_info.extend(info_list)
info_counter = Counter(aggregated_info)
print("\nAggregated Sensitive Information Count:")
for info, count in info_counter.items():
    print(f"{info}: {count}")

# Visualization for Victim's Sensitive Information

# Bar Chart: Count of each sensitive information type
if info_counter:
    plt.figure(figsize=(8, 4))
    bars = plt.bar(info_counter.keys(), info_counter.values(), color='lightcoral')
    plt.xlabel("Sensitive Information Type")
    plt.ylabel("Count")
    plt.title("Sensitive Information Given Up (Bar Chart)")
    plt.xticks(rotation=45, ha="right")
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, yval + 0.1, int(yval), ha='center', va='bottom')
    plt.tight_layout()
    plt.show()

# Pie Chart: Proportion of sensitive information types
if info_counter:
    plt.figure(figsize=(6, 6))
    labels = list(info_counter.keys())
    sizes = list(info_counter.values())
    plt.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=140, colors=plt.cm.Pastel1.colors)
    plt.title("Sensitive Information Distribution (Pie Chart)")
    plt.axis('equal')
    plt.show()

# Scatter Plot: Relationship between word count and sensitive info count per message
plt.figure(figsize=(8, 6))
plt.scatter(df_victim['word_count'], df_victim['sensitive_info_count'], s=100, color='mediumseagreen', alpha=0.7)
plt.xlabel("Word Count per Message")
plt.ylabel("Number of Sensitive Information Types")
plt.title("Message Length vs. Sensitive Information Count")
plt.grid(True)
for idx, row in df_victim.iterrows():
    plt.annotate(f"Msg {idx+1}", (row['word_count'], row['sensitive_info_count']),
                 textcoords="offset points", xytext=(5,5), ha='center')
plt.show()

# ---- Adding User (Victim) Sentiment Analysis ----

def analyze_sentiment(text):
    blob = TextBlob(text)
    return blob.sentiment.polarity, blob.sentiment.subjectivity

# Compute sentiment scores for victim messages
df_victim[['polarity', 'subjectivity']] = df_victim['message'].apply(lambda x: pd.Series(analyze_sentiment(x)))
print("\nVictim messages with sentiment analysis:")
print(df_victim[['message', 'polarity', 'subjectivity']])

# Visualization: Scatter Plot for Victim Sentiment
plt.figure(figsize=(8, 6))
plt.scatter(df_victim.index, df_victim['polarity'], color='green', label='Polarity', s=100)
plt.scatter(df_victim.index, df_victim['subjectivity'], color='orange', label='Subjectivity', s=100)
plt.xlabel("Message Index")
plt.ylabel("Sentiment Score")
plt.title("Sentiment Analysis of Victim Messages")
plt.legend()
plt.grid(True)
plt.show()

# =====================
# Part 2: Analyze Scammer's (Agent's) Persuasive Techniques
# =====================

# Extract scammer messages
df_scammer = df[df['speaker'] == 'scammer'].copy()

# Analysis 1: Word Frequency in Scammer Messages
def get_most_common_words(text_series, n=15):
    all_text = ' '.join(text_series).lower()
    words = re.findall(r'\w+', all_text)
    return Counter(words).most_common(n)

scammer_common = get_most_common_words(df_scammer['message'])
print("\nMost common words in scammer messages:")
for word, count in scammer_common:
    print(f"{word}: {count}")

# Analysis 2: Sentiment Analysis on Scammer Messages using TextBlob
df_scammer[['polarity', 'subjectivity']] = df_scammer['message'].apply(lambda x: pd.Series(analyze_sentiment(x)))
print("\nScammer messages with sentiment analysis:")
print(df_scammer[['message', 'polarity', 'subjectivity']])

# Visualization: Scatter Plot of Sentiment Scores for Scammer Messages
plt.figure(figsize=(8, 6))
plt.scatter(df_scammer.index, df_scammer['polarity'], color='blue', label='Polarity', s=100)
plt.scatter(df_scammer.index, df_scammer['subjectivity'], color='red', label='Subjectivity', s=100)
plt.xlabel("Message Index")
plt.ylabel("Sentiment Score")
plt.title("Sentiment Analysis of Scammer Messages")
plt.legend()
plt.grid(True)
plt.show()

# Analysis 3: Detecting Persuasive Phrases in Scammer Messages
persuasive_phrases = [
    "please confirm", "we need", "verify", "unusual activity",
    "fraud prevention", "securing your account", "for further verification"
]

def find_persuasive_phrases(text):
    found = []
    text_lower = text.lower()
    for phrase in persuasive_phrases:
        if phrase in text_lower:
            found.append(phrase)
    return found

df_scammer['persuasive_phrases'] = df_scammer['message'].apply(find_persuasive_phrases)
print("\nScammer messages with persuasive phrases identified:")
print(df_scammer[['message', 'persuasive_phrases']])

# Visualization: Bar Chart for Frequency of Persuasive Phrases
all_phrases = [phrase for phrases in df_scammer['persuasive_phrases'] for phrase in phrases]
phrase_counter = Counter(all_phrases)
if phrase_counter:
    plt.figure(figsize=(8, 4))
    bars = plt.bar(phrase_counter.keys(), phrase_counter.values(), color='mediumpurple')
    plt.xlabel("Persuasive Phrase")
    plt.ylabel("Frequency")
    plt.title("Frequency of Persuasive Phrases in Scammer Messages")
    plt.xticks(rotation=45, ha="right")
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, yval + 0.1, int(yval), ha='center', va='bottom')
    plt.tight_layout()
    plt.show()
