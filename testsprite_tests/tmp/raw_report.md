
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** pei-collab
- **Date:** 2025-11-11
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001
- **Test Name:** Authentication Success for Each Role
- **Test Code:** [TC001_Authentication_Success_for_Each_Role.py](./TC001_Authentication_Success_for_Each_Role.py)
- **Test Error:** Login failure detected for superadmin role. The page does not redirect or show any success indication after submitting valid credentials. Further testing for other roles cannot proceed until this issue is resolved.
Browser Console Logs:
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] GoTrueClient@sb-fximylewmvsllkdczovj-auth-token:1 (2.80.0) 2025-11-12T01:43:47.184Z Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key. (at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=98707419:7737:14)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6ae47784-3281-459a-be49-aabebacaf057/5db8ed51-416c-47e4-bbeb-18276427730b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002
- **Test Name:** Authentication Failure with Incorrect Credentials
- **Test Code:** [TC002_Authentication_Failure_with_Incorrect_Credentials.py](./TC002_Authentication_Failure_with_Incorrect_Credentials.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6ae47784-3281-459a-be49-aabebacaf057/0844db44-0edd-4b4e-9ef7-06a321ca1e5e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003
- **Test Name:** Role-Based Access Control Enforcement
- **Test Code:** [TC003_Role_Based_Access_Control_Enforcement.py](./TC003_Role_Based_Access_Control_Enforcement.py)
- **Test Error:** Login failure with valid credentials prevents further testing of role-based access and row-level security. Issue reported and testing stopped.
Browser Console Logs:
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] GoTrueClient@sb-fximylewmvsllkdczovj-auth-token:1 (2.80.0) 2025-11-12T01:43:50.766Z Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key. (at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=98707419:7737:14)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6ae47784-3281-459a-be49-aabebacaf057/f47256f5-e811-4d66-a0ae-fac81603c6fa
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004
- **Test Name:** Create PEI with Multi-Teacher Assignment
- **Test Code:** [TC004_Create_PEI_with_Multi_Teacher_Assignment.py](./TC004_Create_PEI_with_Multi_Teacher_Assignment.py)
- **Test Error:** Stopped testing due to login failure. Unable to proceed with PEI creation and teacher assignment as login is a prerequisite. Reported the issue for resolution.
Browser Console Logs:
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] GoTrueClient@sb-fximylewmvsllkdczovj-auth-token:1 (2.80.0) 2025-11-12T01:43:47.428Z Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key. (at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=98707419:7737:14)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6ae47784-3281-459a-be49-aabebacaf057/405d793f-5f4b-4de6-be61-dbb09a572243
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005
- **Test Name:** PEI Versioning Ensures Single Active Version Per Student
- **Test Code:** [TC005_PEI_Versioning_Ensures_Single_Active_Version_Per_Student.py](./TC005_PEI_Versioning_Ensures_Single_Active_Version_Per_Student.py)
- **Test Error:** The task to check if the system automatically maintains only one active PEI version per student and retains complete version history could not be completed because valid login credentials were not available. All login attempts with the provided credentials failed, preventing access to the system to create initial and new PEI versions and verify version history. Therefore, the task is incomplete.
Browser Console Logs:
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] GoTrueClient@sb-fximylewmvsllkdczovj-auth-token:1 (2.80.0) 2025-11-12T01:43:51.976Z Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key. (at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=98707419:7737:14)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6ae47784-3281-459a-be49-aabebacaf057/b7481fe4-f90b-419a-9bad-8c34ee9da400
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006
- **Test Name:** PEI Approval Workflow and Notification Delivery
- **Test Code:** [TC006_PEI_Approval_Workflow_and_Notification_Delivery.py](./TC006_PEI_Approval_Workflow_and_Notification_Delivery.py)
- **Test Error:** The login failure issue was reported due to inability to log in with valid credentials, preventing further testing of PEI submission notifications and approval updates. Task is stopped as requested.
Browser Console Logs:
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] GoTrueClient@sb-fximylewmvsllkdczovj-auth-token:1 (2.80.0) 2025-11-12T01:43:52.787Z Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key. (at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=98707419:7737:14)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6ae47784-3281-459a-be49-aabebacaf057/472e842f-2241-4679-9bec-5d6b9cc91dd7
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007
- **Test Name:** Offline Data Caching and Synchronization
- **Test Code:** [TC007_Offline_Data_Caching_and_Synchronization.py](./TC007_Offline_Data_Caching_and_Synchronization.py)
- **Test Error:** Login failed due to incorrect credentials. Please provide valid login credentials to continue testing offline usage with IndexedDB caching, editing PEIs offline, and automatic sync with conflict resolution.
Browser Console Logs:
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] GoTrueClient@sb-fximylewmvsllkdczovj-auth-token:1 (2.80.0) 2025-11-12T01:43:47.191Z Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key. (at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=98707419:7737:14)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6ae47784-3281-459a-be49-aabebacaf057/b3fc7d4f-421c-44c6-9efa-59e461004f2c
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008
- **Test Name:** User Profile Editing and Avatar Customization
- **Test Code:** [TC008_User_Profile_Editing_and_Avatar_Customization.py](./TC008_User_Profile_Editing_and_Avatar_Customization.py)
- **Test Error:** Account creation succeeded but requires administrator activation before login. Without an active account, it is impossible to proceed with verifying user profile updates and avatar customization. Testing is blocked until account activation or valid test credentials are provided.
Browser Console Logs:
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] GoTrueClient@sb-fximylewmvsllkdczovj-auth-token:1 (2.80.0) 2025-11-12T01:43:46.810Z Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key. (at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=98707419:7737:14)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/signup:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6ae47784-3281-459a-be49-aabebacaf057/9772b99d-5a75-473a-a9bb-ea4679a9281c
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009
- **Test Name:** Family Access Token Generation and Validation
- **Test Code:** [TC009_Family_Access_Token_Generation_and_Validation.py](./TC009_Family_Access_Token_Generation_and_Validation.py)
- **Test Error:** Login as coordinator failed repeatedly despite correct credentials. Unable to proceed with testing family access token generation, expiration control, and PEI access. Reporting issue and stopping further testing.
Browser Console Logs:
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] GoTrueClient@sb-fximylewmvsllkdczovj-auth-token:1 (2.80.0) 2025-11-12T01:43:45.757Z Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key. (at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=98707419:7737:14)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6ae47784-3281-459a-be49-aabebacaf057/eb041b6f-4fc4-407d-911c-0d8309085caf
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010
- **Test Name:** Multi-Tenant Data Separation Enforcement
- **Test Code:** [TC010_Multi_Tenant_Data_Separation_Enforcement.py](./TC010_Multi_Tenant_Data_Separation_Enforcement.py)
- **Test Error:** Login failure prevents proceeding with tenant and school data isolation testing. Reported the issue and stopped further actions.
Browser Console Logs:
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] GoTrueClient@sb-fximylewmvsllkdczovj-auth-token:1 (2.80.0) 2025-11-12T01:43:54.614Z Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key. (at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=98707419:7737:14)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6ae47784-3281-459a-be49-aabebacaf057/24fbeb8b-f492-414f-b8ee-b9b351a19c26
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011
- **Test Name:** Responsive UI on Mobile and Desktop
- **Test Code:** [TC011_Responsive_UI_on_Mobile_and_Desktop.py](./TC011_Responsive_UI_on_Mobile_and_Desktop.py)
- **Test Error:** The task to verify that dashboards and key interfaces adapt correctly on various screen sizes was partially completed. Desktop screen size testing confirmed that navigation, multi-tab views, login, and create account pages display correctly with expected UI elements and layouts. However, mobile device or emulator testing to confirm navigation drawer, tabs, and calendar adaptation to mobile sizes and usability was not performed due to environment constraints. Therefore, the task is marked as partially complete with success=false.
Browser Console Logs:
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] GoTrueClient@sb-fximylewmvsllkdczovj-auth-token:1 (2.80.0) 2025-11-12T01:44:21.839Z Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key. (at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=98707419:7737:14)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] GoTrueClient@sb-fximylewmvsllkdczovj-auth-token:1 (2.80.0) 2025-11-12T01:45:22.589Z Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key. (at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=98707419:7737:14)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] GoTrueClient@sb-fximylewmvsllkdczovj-auth-token:1 (2.80.0) 2025-11-12T01:45:37.625Z Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key. (at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=98707419:7737:14)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] GoTrueClient@sb-fximylewmvsllkdczovj-auth-token:1 (2.80.0) 2025-11-12T01:46:36.722Z Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key. (at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=98707419:7737:14)
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6ae47784-3281-459a-be49-aabebacaf057/938c81a2-3f71-48bd-934b-6aed8dda2c0d
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012
- **Test Name:** PDF Generation and Print of PEIs
- **Test Code:** [TC012_PDF_Generation_and_Print_of_PEIs.py](./TC012_PDF_Generation_and_Print_of_PEIs.py)
- **Test Error:** Login attempts failed due to lack of valid credentials. Cannot proceed with testing on-demand generation of formatted PEI PDF documents, PDF preview, and print functionality without access to saved PEIs. Stopping the test here.
Browser Console Logs:
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] GoTrueClient@sb-fximylewmvsllkdczovj-auth-token:1 (2.80.0) 2025-11-12T01:43:58.282Z Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key. (at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=98707419:7737:14)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6ae47784-3281-459a-be49-aabebacaf057/a9a73c0c-bf5a-4883-810e-6c356102328e
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013
- **Test Name:** Custom Network Logo Upload and Display
- **Test Code:** [TC013_Custom_Network_Logo_Upload_and_Display.py](./TC013_Custom_Network_Logo_Upload_and_Display.py)
- **Test Error:** The education secretary account has been created but requires administrator activation before login is possible. Without admin activation, it is not possible to login and proceed with uploading a custom network logo or verifying its display in dashboards. The task cannot be completed further without admin intervention. Please activate the education secretary account to continue testing the upload and display of the custom network logo.
Browser Console Logs:
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] GoTrueClient@sb-fximylewmvsllkdczovj-auth-token:1 (2.80.0) 2025-11-12T01:43:53.876Z Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key. (at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=98707419:7737:14)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/signup:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6ae47784-3281-459a-be49-aabebacaf057/77dfd972-a323-4fdf-a723-47bb559a5597
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014
- **Test Name:** Dark Mode Toggle Persistence
- **Test Code:** [TC014_Dark_Mode_Toggle_Persistence.py](./TC014_Dark_Mode_Toggle_Persistence.py)
- **Test Error:** Dark mode toggle control was not found on the accessible pages of the application. Therefore, the toggle functionality and persistence across sessions could not be tested or verified. The UI theme did not change to dark mode as no toggle was located. Please verify if the dark mode toggle is implemented and accessible in the application.
Browser Console Logs:
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6ae47784-3281-459a-be49-aabebacaf057/f0b51e64-9540-4483-8c16-06b9ddfe9180
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015
- **Test Name:** Real-Time Notifications with Action Handlers
- **Test Code:** [TC015_Real_Time_Notifications_with_Action_Handlers.py](./TC015_Real_Time_Notifications_with_Action_Handlers.py)
- **Test Error:** The task to ensure real-time notifications for PEI lifecycle events and support actions such as marking as read and deletion could not be fully completed due to inability to login. Multiple login attempts with provided credentials failed with error 'Email ou senha incorretos. Tente novamente.'. Without valid login credentials, it was not possible to trigger PEI lifecycle events, verify notifications, or perform notification actions. Please provide valid credentials to continue testing.
Browser Console Logs:
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] GoTrueClient@sb-fximylewmvsllkdczovj-auth-token:1 (2.80.0) 2025-11-12T01:44:03.410Z Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key. (at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=98707419:7737:14)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6ae47784-3281-459a-be49-aabebacaf057/d01951b4-a74b-424e-97ff-32056bec468c
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016
- **Test Name:** System Logging and Audit Trails
- **Test Code:** [TC016_System_Logging_and_Audit_Trails.py](./TC016_System_Logging_and_Audit_Trails.py)
- **Test Error:** Account creation form submission failure prevents proceeding with PEI operations. Unable to verify logging of critical events due to lack of system access. Please fix the registration issue to continue testing.
Browser Console Logs:
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] GoTrueClient@sb-fximylewmvsllkdczovj-auth-token:1 (2.80.0) 2025-11-12T01:44:00.034Z Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key. (at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=98707419:7737:14)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/signup:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6ae47784-3281-459a-be49-aabebacaf057/b9a71899-15bc-4a05-a0d4-5a3bc2a2d5e7
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017
- **Test Name:** PWA Installation and Service Worker Offline Caching
- **Test Code:** [TC017_PWA_Installation_and_Service_Worker_Offline_Caching.py](./TC017_PWA_Installation_and_Service_Worker_Offline_Caching.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6ae47784-3281-459a-be49-aabebacaf057/613ec09e-59f6-4b2d-bf6d-5eaf911d8c05
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC018
- **Test Name:** Coordinator's PEI Queue Management and Token Generation
- **Test Code:** [TC018_Coordinators_PEI_Queue_Management_and_Token_Generation.py](./TC018_Coordinators_PEI_Queue_Management_and_Token_Generation.py)
- **Test Error:** Login as coordinator failed repeatedly. Coordinator cannot access the PEI validation queue or perform any further actions. Reporting the issue and stopping the test as the core functionality is blocked.
Browser Console Logs:
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] GoTrueClient@sb-fximylewmvsllkdczovj-auth-token:1 (2.80.0) 2025-11-12T01:43:54.778Z Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key. (at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=98707419:7737:14)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6ae47784-3281-459a-be49-aabebacaf057/58278bc4-6bc8-4893-87b5-bc7470c4c23f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC019
- **Test Name:** Student and Enrollment Management Historical Records
- **Test Code:** [TC019_Student_and_Enrollment_Management_Historical_Records.py](./TC019_Student_and_Enrollment_Management_Historical_Records.py)
- **Test Error:** Login attempts with both admin and teacher accounts failed, preventing access to the system. Cannot proceed with testing student record creation, updating, and access control. Reporting the issue and stopping further testing.
Browser Console Logs:
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] GoTrueClient@sb-fximylewmvsllkdczovj-auth-token:1 (2.80.0) 2025-11-12T01:44:01.291Z Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key. (at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=98707419:7737:14)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6ae47784-3281-459a-be49-aabebacaf057/b8bbf1ba-9796-46d8-bdc5-e8853dd790cd
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC020
- **Test Name:** Global and Role-Specific Reporting Accuracy and Export
- **Test Code:** [TC020_Global_and_Role_Specific_Reporting_Accuracy_and_Export.py](./TC020_Global_and_Role_Specific_Reporting_Accuracy_and_Export.py)
- **Test Error:** The task to ensure statistical reports for global superadmin and role-specific reports generate correct analytics and export to CSV/Excel formats could not be fully completed. Multiple login attempts for superadmin and coordinator roles failed due to incorrect credentials. Password recovery was initiated but no new credentials were available to proceed. Without successful login, access to reports and verification of analytics and export functionality was not possible. Please provide valid credentials to continue testing or verify system access.
Browser Console Logs:
[WARNING] ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. (at http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=74b773ec:4392:12)
[WARNING] GoTrueClient@sb-fximylewmvsllkdczovj-auth-token:1 (2.80.0) 2025-11-12T01:44:00.458Z Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key. (at http://localhost:8080/node_modules/.vite/deps/@supabase_supabase-js.js?v=98707419:7737:14)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://fximylewmvsllkdczovj.supabase.co/auth/v1/token?grant_type=password:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6ae47784-3281-459a-be49-aabebacaf057/a0c56388-600d-4ec2-a56e-a3066cdac3ec
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **10.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---