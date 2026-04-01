# WhatsApp Web QR Integration Setup

## Installation Script

### Step 1: Install Required Tools
```powershell
# Install Python
winget install Python.Python.3.11

# Verify installation
python --version

# Install required libraries
pip install selenium playwright

# Install browser drivers
playwright install
```

### Step 2: Create Configuration File
```powershell
# Create config file
New-Item -Path "config.json" -ItemType File -Value '{
  "whatsapp": {
    "target_group": "Power Outage Alerts",
    "message_template": "POWER OUTAGE ALERT\nLocation: {location}\nStatus: {status}\nTime: {time}\nEstimated Restoration: {restoration}\nAdditional Info: {info}",
    "headless": false
  },
  "alerts": {
    "check_interval": 300,
    "max_messages_per_hour": 10
  }
}'
```

### Step 3: Create Main Script
```powershell
# Create main script
New-Item -Path "whatsapp_bot.py" -ItemType File -Value 'import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
import os

def load_config():
    with open("config.json", "r") as f:
        return json.load(f)

def init_browser(config):
    options = Options()
    options.headless = config["whatsapp"]["headless"]
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    
    service = Service("chromedriver")
    driver = webdriver.Chrome(service=service, options=options)
    return driver

def open_whatsapp(driver):
    driver.get("https://web.whatsapp.com")
    print("Open WhatsApp Web and scan QR code...")
    # Wait for user to scan QR code
    input("Press Enter after scanning QR code...")
    return True

def find_group(driver, group_name):
    search_box = driver.find_element(By.XPATH, "//div[contains(@class, 'copyable-text selectable-text')]")
    search_box.send_keys(group_name)
    time.sleep(2)
    
    # Click on the first result
    results = driver.find_elements(By.XPATH, "//span[@class='_3ko9 _3Q9N _35P4E _1OVBB _3KkQP"]")
    if results:
        results[0].click()
        time.sleep(2)
        return True
    return False

def send_message(driver, message):
    message_box = driver.find_element(By.XPATH, "//div[contains(@class, 'copyable-text selectable-text')]")
    message_box.send_keys(message)
    message_box.send_keys(Keys.RETURN)
    print(f"Message sent: {message}")
    return True

def check_power_outage():
    # TODO: Add your power outage detection logic here
    # This is a placeholder
    import random
    if random.random() > 0.8:  # 20% chance of outage
        return {
            "location": "Downtown Area",
            "status": "Active",
            "time": "2026-03-14 07:20",
            "restoration": "2026-03-14 12:00",
            "info": "Main transformer failure"
        }
    return None

def main():
    config = load_config()
    
    print("Starting WhatsApp Bot...")
    driver = init_browser(config)
    
    if not open_whatsapp(driver):
        print("Failed to open WhatsApp Web")
        return
    
    if not find_group(driver, config["whatsapp"]["target_group"]):
        print(f"Group '{config["whatsapp"]["target_group"]}' not found")
        return
    
    print("Monitoring for power outages...")
    
    while True:
        outage = check_power_outage()
        if outage:
            message = config["whatsapp"]["message_template"].format(**outage)
            send_message(driver, message)
            print("Waiting for next check...")
        
        time.sleep(config["alerts"]["check_interval"])

if __name__ == "__main__":
    main()'
```

### Step 4: Run the Setup
```powershell
# Make scripts executable
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run the setup
python whatsapp_bot.py
```

## Files Created
- `config.json` - Configuration settings
- `whatsapp_bot.py` - Main automation script
- `requirements.txt` - Python dependencies

## Next Steps
1. Run the installation script
2. Open WhatsApp Web and scan QR code
3. Configure your power outage detection
4. Test message delivery
5. Deploy to production

## Troubleshooting
- If QR code doesn't work, refresh WhatsApp Web
- Check browser permissions
- Verify Python installation
- Test network connection

---

*Last updated: 2026-03-14*
