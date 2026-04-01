# WhatsApp Web QR Code Integration Steps

## Quick Setup Guide

### Step 1: Prepare Your Environment
1. Install Python 3.8+
2. Install required libraries:
   ```bash
   pip install selenium playwright
   ```

### Step 2: Set Up WhatsApp Web
1. Open https://web.whatsapp.com
2. Keep browser open and logged in
3. Scan QR code with your phone
4. Don't close the browser

### Step 3: Create Automation Script
1. Create a new Python file
2. Add WhatsApp Web automation code
3. Configure message handling
4. Test basic functionality

### Step 4: Configure Alerts
1. Set up power outage detection
2. Configure message templates
3. Add scheduling
4. Test alert system

## Files to Create

### 1. Requirements File
```
# requirements.txt
selenium==4.15.0
playwright==1.40.0
```

### 2. Main Script
```python
# whatsapp_bot.py
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import time

# Setup
options = Options()
options.headless = False  # Set to True for background operation
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

service = Service('chromedriver')
driver = webdriver.Chrome(service=service, options=options)

driver.get('https://web.whatsapp.com')

# Wait for QR code scan
print("Scan QR code with your phone...")
time.sleep(30)

# Find target contact/group
search_box = driver.find_element(By.XPATH, "//div[contains(@class, 'copyable-text selectable-text')]")
search_box.send_keys('Power Outage Alerts')
time.sleep(2)

# Send message
message_box = driver.find_element(By.XPATH, "//div[contains(@class, 'copyable-text selectable-text')]")
message_box.send_keys('Test message from OpenClaw')

# Click send
# ...
```

## Next Steps

1. Install Python and libraries
2. Run QR code setup
3. Test basic messaging
4. Configure alert system
5. Deploy automation

---

*Last updated: 2026-03-14*
