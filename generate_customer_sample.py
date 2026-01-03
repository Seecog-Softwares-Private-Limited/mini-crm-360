#!/usr/bin/env python3
"""
Generate a sample Excel file with 100 customers for bulk upload testing.
Based on the Customer model schema and bulk upload requirements.
"""

import pandas as pd
import random
from datetime import datetime, timedelta

# Indian first names
FIRST_NAMES = [
    'Raj', 'Priya', 'Amit', 'Anita', 'Rahul', 'Sneha', 'Vikram', 'Kavya',
    'Arjun', 'Meera', 'Karan', 'Divya', 'Rohan', 'Pooja', 'Siddharth', 'Neha',
    'Aditya', 'Shreya', 'Varun', 'Anjali', 'Kunal', 'Swati', 'Manish', 'Ishita',
    'Ravi', 'Kiran', 'Nikhil', 'Preeti', 'Suresh', 'Radha', 'Pankaj', 'Jyoti',
    'Mohan', 'Sonia', 'Deepak', 'Riya', 'Anil', 'Nidhi', 'Sunil', 'Aarti',
    'Vishal', 'Seema', 'Gaurav', 'Komal', 'Ashish', 'Ira', 'Ritesh', 'Sakshi',
    'Harsh', 'Diya', 'Yash', 'Aadhya', 'Kabir', 'Ananya', 'Vihaan', 'Myra',
    'Aarav', 'Aisha', 'Atharv', 'Reyansh', 'Ishaan', 'Vivaan', 'Shaurya', 'Dhruv'
]

# Indian last names
LAST_NAMES = [
    'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Verma', 'Agarwal', 'Yadav',
    'Mehta', 'Jain', 'Reddy', 'Malhotra', 'Chopra', 'Kapoor', 'Bansal', 'Rao',
    'Khanna', 'Joshi', 'Nair', 'Iyer', 'Das', 'Roy', 'Ghosh', 'Pandey',
    'Mishra', 'Tripathi', 'Saxena', 'Shetty', 'Bhat', 'Chatterjee', 'Malhotra', 'Agarwal'
]

# Email domains
EMAIL_DOMAINS = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'rediffmail.com',
    'business.in', 'company.com', 'enterprise.in'
]

# Tags for customers
TAGS = ['vip', 'regular', 'premium', 'new', 'trial', 'loyal', 'frequent']

def generate_phone():
    """Generate a valid 10-digit Indian phone number"""
    # Indian mobile numbers start with 6, 7, 8, or 9
    first_digit = random.choice(['6', '7', '8', '9'])
    remaining = ''.join([str(random.randint(0, 9)) for _ in range(9)])
    return first_digit + remaining

def generate_email(first_name, last_name):
    """Generate a realistic email address"""
    domain = random.choice(EMAIL_DOMAINS)
    formats = [
        f"{first_name.lower()}.{last_name.lower()}@{domain}",
        f"{first_name.lower()}{last_name.lower()}@{domain}",
        f"{first_name.lower()}{random.randint(10, 99)}@{domain}",
        f"{first_name.lower()}.{last_name.lower()}{random.randint(1, 9)}@{domain}"
    ]
    return random.choice(formats)

def generate_consent_date():
    """Generate a consent date within the last 6 months"""
    days_ago = random.randint(0, 180)
    consent_date = datetime.now() - timedelta(days=days_ago)
    return consent_date.strftime('%Y-%m-%d')

def generate_customer_data(num_customers=100):
    """Generate customer data"""
    customers = []
    used_phones = set()
    
    for i in range(num_customers):
        # Generate unique phone number
        phone = generate_phone()
        while phone in used_phones:
            phone = generate_phone()
        used_phones.add(phone)
        
        # Generate name
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        name = f"{first_name} {last_name}"
        
        # Generate email (80% chance)
        email = generate_email(first_name, last_name) if random.random() < 0.8 else ''
        
        # Generate WhatsApp (70% chance, otherwise same as phone)
        whatsapp = generate_phone() if random.random() < 0.3 else phone
        
        # Generate tags (1-2 tags per customer)
        num_tags = random.randint(1, 2)
        tags = ','.join(random.sample(TAGS, num_tags))
        
        # Generate consent date (90% chance)
        consent_at = generate_consent_date() if random.random() < 0.9 else ''
        
        customer = {
            'name': name,
            'phoneE164': phone,
            'email': email,
            'whatsappE164': whatsapp,
            'tags': tags,
            'consentAt': consent_at
        }
        
        customers.append(customer)
    
    return customers

def main():
    """Main function to generate and save Excel file"""
    print("Generating 100 sample customers...")
    customers = generate_customer_data(100)
    
    # Create DataFrame
    df = pd.DataFrame(customers)
    
    # Reorder columns to match expected format
    column_order = ['name', 'phoneE164', 'email', 'whatsappE164', 'tags', 'consentAt']
    df = df[column_order]
    
    # Save to Excel file
    output_file = 'sample_customers_100.xlsx'
    df.to_excel(output_file, index=False, engine='openpyxl')
    
    print(f"\n✅ Successfully generated {len(customers)} customers")
    print(f"📁 File saved as: {output_file}")
    print(f"\n📊 Summary:")
    print(f"   - Total customers: {len(customers)}")
    print(f"   - With email: {df['email'].notna().sum()}")
    print(f"   - With consent date: {df['consentAt'].notna().sum()}")
    print(f"   - Unique phone numbers: {df['phoneE164'].nunique()}")
    print(f"\n📋 Column format:")
    print(f"   - name: Customer full name")
    print(f"   - phoneE164: 10-digit phone number (will be converted to +91XXXXXXXXXX)")
    print(f"   - email: Email address (optional)")
    print(f"   - whatsappE164: WhatsApp number (optional, defaults to phoneE164)")
    print(f"   - tags: Comma-separated tags (optional)")
    print(f"   - consentAt: ISO date format YYYY-MM-DD (optional)")
    print(f"\n💡 Usage:")
    print(f"   1. Open the Excel file and review the data")
    print(f"   2. Use the bulk upload feature in the CRM")
    print(f"   3. Select this file for upload")
    print(f"   4. The system will automatically convert phone numbers to E.164 format")

if __name__ == '__main__':
    main()

"""
Generate a sample Excel file with 100 customers for bulk upload testing.
Based on the Customer model schema and bulk upload requirements.
"""

import pandas as pd
import random
from datetime import datetime, timedelta

# Indian first names
FIRST_NAMES = [
    'Raj', 'Priya', 'Amit', 'Anita', 'Rahul', 'Sneha', 'Vikram', 'Kavya',
    'Arjun', 'Meera', 'Karan', 'Divya', 'Rohan', 'Pooja', 'Siddharth', 'Neha',
    'Aditya', 'Shreya', 'Varun', 'Anjali', 'Kunal', 'Swati', 'Manish', 'Ishita',
    'Ravi', 'Kiran', 'Nikhil', 'Preeti', 'Suresh', 'Radha', 'Pankaj', 'Jyoti',
    'Mohan', 'Sonia', 'Deepak', 'Riya', 'Anil', 'Nidhi', 'Sunil', 'Aarti',
    'Vishal', 'Seema', 'Gaurav', 'Komal', 'Ashish', 'Ira', 'Ritesh', 'Sakshi',
    'Harsh', 'Diya', 'Yash', 'Aadhya', 'Kabir', 'Ananya', 'Vihaan', 'Myra',
    'Aarav', 'Aisha', 'Atharv', 'Reyansh', 'Ishaan', 'Vivaan', 'Shaurya', 'Dhruv'
]

# Indian last names
LAST_NAMES = [
    'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Verma', 'Agarwal', 'Yadav',
    'Mehta', 'Jain', 'Reddy', 'Malhotra', 'Chopra', 'Kapoor', 'Bansal', 'Rao',
    'Khanna', 'Joshi', 'Nair', 'Iyer', 'Das', 'Roy', 'Ghosh', 'Pandey',
    'Mishra', 'Tripathi', 'Saxena', 'Shetty', 'Bhat', 'Chatterjee', 'Malhotra', 'Agarwal'
]

# Email domains
EMAIL_DOMAINS = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'rediffmail.com',
    'business.in', 'company.com', 'enterprise.in'
]

# Tags for customers
TAGS = ['vip', 'regular', 'premium', 'new', 'trial', 'loyal', 'frequent']

def generate_phone():
    """Generate a valid 10-digit Indian phone number"""
    # Indian mobile numbers start with 6, 7, 8, or 9
    first_digit = random.choice(['6', '7', '8', '9'])
    remaining = ''.join([str(random.randint(0, 9)) for _ in range(9)])
    return first_digit + remaining

def generate_email(first_name, last_name):
    """Generate a realistic email address"""
    domain = random.choice(EMAIL_DOMAINS)
    formats = [
        f"{first_name.lower()}.{last_name.lower()}@{domain}",
        f"{first_name.lower()}{last_name.lower()}@{domain}",
        f"{first_name.lower()}{random.randint(10, 99)}@{domain}",
        f"{first_name.lower()}.{last_name.lower()}{random.randint(1, 9)}@{domain}"
    ]
    return random.choice(formats)

def generate_consent_date():
    """Generate a consent date within the last 6 months"""
    days_ago = random.randint(0, 180)
    consent_date = datetime.now() - timedelta(days=days_ago)
    return consent_date.strftime('%Y-%m-%d')

def generate_customer_data(num_customers=100):
    """Generate customer data"""
    customers = []
    used_phones = set()
    
    for i in range(num_customers):
        # Generate unique phone number
        phone = generate_phone()
        while phone in used_phones:
            phone = generate_phone()
        used_phones.add(phone)
        
        # Generate name
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        name = f"{first_name} {last_name}"
        
        # Generate email (80% chance)
        email = generate_email(first_name, last_name) if random.random() < 0.8 else ''
        
        # Generate WhatsApp (70% chance, otherwise same as phone)
        whatsapp = generate_phone() if random.random() < 0.3 else phone
        
        # Generate tags (1-2 tags per customer)
        num_tags = random.randint(1, 2)
        tags = ','.join(random.sample(TAGS, num_tags))
        
        # Generate consent date (90% chance)
        consent_at = generate_consent_date() if random.random() < 0.9 else ''
        
        customer = {
            'name': name,
            'phoneE164': phone,
            'email': email,
            'whatsappE164': whatsapp,
            'tags': tags,
            'consentAt': consent_at
        }
        
        customers.append(customer)
    
    return customers

def main():
    """Main function to generate and save Excel file"""
    print("Generating 100 sample customers...")
    customers = generate_customer_data(100)
    
    # Create DataFrame
    df = pd.DataFrame(customers)
    
    # Reorder columns to match expected format
    column_order = ['name', 'phoneE164', 'email', 'whatsappE164', 'tags', 'consentAt']
    df = df[column_order]
    
    # Save to Excel file
    output_file = 'sample_customers_100.xlsx'
    df.to_excel(output_file, index=False, engine='openpyxl')
    
    print(f"\n✅ Successfully generated {len(customers)} customers")
    print(f"📁 File saved as: {output_file}")
    print(f"\n📊 Summary:")
    print(f"   - Total customers: {len(customers)}")
    print(f"   - With email: {df['email'].notna().sum()}")
    print(f"   - With consent date: {df['consentAt'].notna().sum()}")
    print(f"   - Unique phone numbers: {df['phoneE164'].nunique()}")
    print(f"\n📋 Column format:")
    print(f"   - name: Customer full name")
    print(f"   - phoneE164: 10-digit phone number (will be converted to +91XXXXXXXXXX)")
    print(f"   - email: Email address (optional)")
    print(f"   - whatsappE164: WhatsApp number (optional, defaults to phoneE164)")
    print(f"   - tags: Comma-separated tags (optional)")
    print(f"   - consentAt: ISO date format YYYY-MM-DD (optional)")
    print(f"\n💡 Usage:")
    print(f"   1. Open the Excel file and review the data")
    print(f"   2. Use the bulk upload feature in the CRM")
    print(f"   3. Select this file for upload")
    print(f"   4. The system will automatically convert phone numbers to E.164 format")

if __name__ == '__main__':
    main()

