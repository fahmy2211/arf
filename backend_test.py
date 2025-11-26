import requests
import sys
import json
import io
from datetime import datetime
from pathlib import Path

class ArciansProfileAPITester:
    def __init__(self, base_url="https://profile-card-gen.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_profiles = []

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else self.api_url
        headers = {}
        
        if data and not files:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_file_upload(self):
        """Test file upload endpoint"""
        # Create a dummy image file
        dummy_image = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {'file': ('test.png', io.BytesIO(dummy_image), 'image/png')}
        success, response = self.run_test("File Upload", "POST", "upload", 200, files=files)
        
        if success and 'url' in response:
            return response['url']
        return None

    def test_create_profile(self, photo_url=None):
        """Test profile creation"""
        profile_data = {
            "name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "role": "Cyber Security Expert",
            "bio": "Testing the ARCIANS profile system with encrypted identity generation.",
            "photo_url": photo_url
        }
        
        success, response = self.run_test(
            "Create Profile", 
            "POST", 
            "profiles", 
            200, 
            data=profile_data
        )
        
        if success and 'id' in response:
            self.created_profiles.append(response)
            return response
        return None

    def test_get_all_profiles(self):
        """Test getting all profiles"""
        success, response = self.run_test("Get All Profiles", "GET", "profiles", 200)
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} profiles")
            return response
        return []

    def test_get_profile_by_id(self, profile_id):
        """Test getting specific profile by ID"""
        return self.run_test(
            f"Get Profile {profile_id}", 
            "GET", 
            f"profiles/{profile_id}", 
            200
        )

    def validate_profile_structure(self, profile):
        """Validate profile has required fields"""
        required_fields = ['id', 'name', 'role', 'encrypted_id', 'created_at']
        missing_fields = []
        
        for field in required_fields:
            if field not in profile:
                missing_fields.append(field)
        
        if missing_fields:
            print(f"❌ Profile missing fields: {missing_fields}")
            return False
        
        # Validate encrypted_id format
        if not profile['encrypted_id'] or len(profile['encrypted_id']) != 12:
            print(f"❌ Invalid encrypted_id format: {profile['encrypted_id']}")
            return False
            
        print(f"✅ Profile structure valid")
        return True

def main():
    print("🚀 Starting ARCIANS Profile API Tests")
    print("=" * 50)
    
    tester = ArciansProfileAPITester()
    
    # Test 1: API Root
    success, _ = tester.test_root_endpoint()
    if not success:
        print("❌ API Root failed, stopping tests")
        return 1

    # Test 2: File Upload
    print("\n📁 Testing File Upload...")
    photo_url = tester.test_file_upload()
    if photo_url:
        print(f"✅ File uploaded successfully: {photo_url}")
    else:
        print("⚠️  File upload failed, continuing without photo")

    # Test 3: Create Profile
    print("\n👤 Testing Profile Creation...")
    profile = tester.test_create_profile(photo_url)
    if not profile:
        print("❌ Profile creation failed, stopping tests")
        return 1
    
    # Validate profile structure
    if not tester.validate_profile_structure(profile):
        print("❌ Profile structure validation failed")
        return 1

    # Test 4: Get All Profiles
    print("\n📋 Testing Get All Profiles...")
    all_profiles = tester.test_get_all_profiles()
    if not all_profiles:
        print("⚠️  No profiles found or API failed")
    else:
        # Validate that our created profile is in the list
        found_profile = False
        for p in all_profiles:
            if p['id'] == profile['id']:
                found_profile = True
                break
        
        if found_profile:
            print("✅ Created profile found in all profiles list")
        else:
            print("❌ Created profile not found in all profiles list")

    # Test 5: Get Profile by ID
    print(f"\n🔍 Testing Get Profile by ID...")
    success, retrieved_profile = tester.test_get_profile_by_id(profile['id'])
    if success:
        if retrieved_profile['id'] == profile['id']:
            print("✅ Profile retrieved successfully by ID")
        else:
            print("❌ Retrieved profile ID mismatch")
    else:
        print("❌ Failed to retrieve profile by ID")

    # Test 6: Test invalid profile ID (404 case)
    print(f"\n🚫 Testing Invalid Profile ID...")
    success, _ = tester.run_test("Get Invalid Profile", "GET", "profiles/invalid-id", 404)
    if success:
        print("✅ 404 handling works correctly")

    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.created_profiles:
        print(f"\n📝 Created Profiles:")
        for p in tester.created_profiles:
            print(f"   - {p['name']} (ID: {p['encrypted_id']})")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())