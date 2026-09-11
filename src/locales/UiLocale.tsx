import type { ReactNode } from "react";
import { useTenantSession } from "../contexts/useTenantSession";
import type { ModuleDefinition } from "../modules/moduleRegistry";

export type UiLocale = "en" | "mm";

export const uiLocaleOptions: Array<{
  label: string;
  locale: UiLocale;
  nativeLabel: string;
}> = [
  { label: "English", locale: "en", nativeLabel: "English" },
  { label: "Myanmar", locale: "mm", nativeLabel: "မြန်မာ" },
];

type TranslateParams = Record<string, string | number>;

const mmTranslations: Record<string, string> = {
  Notifications: "အသိပေးချက်များ",
  "App update required": "အက်ပ်ကို update ပြုလုပ်ရန် လိုအပ်သည်",
  "Checking app version": "အက်ပ်ဗားရှင်းကို စစ်ဆေးနေသည်",
  "Read-only mode": "ဖတ်ရှုရန်သာ အသုံးပြုနိုင်သော အခြေအနေ",
  "Installed version": "အသုံးပြုနေသောဗားရှင်း",
  "Minimum supported version": "အနည်းဆုံး ပံ့ပိုးထားသောဗားရှင်း",
  "Changes are disabled until the app version is confirmed.":
    "အက်ပ်ဗားရှင်း အတည်ပြုပြီးသည်အထိ ပြောင်းလဲမှုများ ပြုလုပ်၍မရပါ။",
  "The server cannot confirm this app version. You can view data, but changes are disabled.":
    "ဆာဗာမှ အက်ပ်ဗားရှင်းကို အတည်မပြုနိုင်ပါ။ အချက်အလက်များကို ကြည့်ရှုနိုင်သော်လည်း ပြောင်းလဲမှုများ ပြုလုပ်၍မရပါ။",
  "Refresh App": "အက်ပ်ကို Refresh လုပ်ရန်",
  Retry: "ပြန်လည်ကြိုးစားရန်",
  "Mark all as read": "အားလုံးကို ဖတ်ပြီးအဖြစ် သတ်မှတ်ရန်",
  "Loading notifications...": "အသိပေးချက်များ ဖွင့်နေသည်...",
  "Unable to load notifications.": "အသိပေးချက်များကို ဖွင့်၍မရပါ။",
  "No notifications yet.": "အသိပေးချက် မရှိသေးပါ။",
  "Reporting currency recalculation queued":
    "အစီရင်ခံငွေကြေး ပြန်လည်တွက်ချက်မှု တန်းစီထားသည်",
  "Reporting currency recalculation started":
    "အစီရင်ခံငွေကြေး ပြန်လည်တွက်ချက်မှု စတင်ပြီ",
  "Historical exchange rates required": "ယခင်ငွေလဲနှုန်းများ လိုအပ်သည်",
  "Reporting currency recalculation completed":
    "အစီရင်ခံငွေကြေး ပြန်လည်တွက်ချက်မှု ပြီးစီးပြီ",
  "Reporting currency recalculation failed":
    "အစီရင်ခံငွေကြေး ပြန်လည်တွက်ချက်မှု မအောင်မြင်ပါ",
  "Reporting currency change cancelled":
    "အစီရင်ခံငွေကြေး ပြောင်းလဲမှု ပယ်ဖျက်ပြီးပါပြီ",
  "missing rate dates": "လိုအပ်သော နှုန်းထားရက်များ",
  "Financial Account Access": "ငွေစာရင်း အကောင့်အသုံးပြုခွင့်",
  "Choose which accounts this staff member can use for financial operations.":
    "ဤဝန်ထမ်းက ငွေကြေးလုပ်ငန်းများတွင် အသုံးပြုနိုင်မည့် အကောင့်များကို ရွေးချယ်ပါ။",
  "Loading financial accounts...": "ငွေစာရင်းအကောင့်များ ဖွင့်နေပါသည်...",
  "No financial accounts are available.":
    "အသုံးပြုနိုင်သော ငွေစာရင်းအကောင့် မရှိပါ။",
  "No financial accounts match your search.":
    "ရှာဖွေမှုနှင့် ကိုက်ညီသော ငွေစာရင်းအကောင့် မရှိပါ။",
  "Account name, code, or currency":
    "အကောင့်အမည်၊ ကုဒ် သို့မဟုတ် ငွေကြေးအမျိုးအစား",
  Account: "အကောင့်",
  Currency: "ငွေကြေးအမျိုးအစား",
  Access: "အသုံးပြုခွင့်",
  "Financial unit": "ငွေကြေးယူနစ်",
  "Unable to load financial units.": "ငွေကြေးယူနစ်များကို ဖွင့်၍မရပါ။",
  Active: "အသုံးပြုနေဆဲ",
  Inactive: "အသုံးမပြုတော့ပါ",
  Assigned: "ခွင့်ပြုထားသည်",
  "Not assigned": "ခွင့်မပြုထားပါ",
  "Save Account Access": "အကောင့်အသုံးပြုခွင့် သိမ်းရန်",
  "Owner account access is managed automatically and cannot be changed.":
    "ပိုင်ရှင်၏ အကောင့်အသုံးပြုခွင့်ကို စနစ်က အလိုအလျောက် စီမံထားပြီး ပြောင်းလဲ၍ မရပါ။",
  "You cannot change your own financial account access.":
    "မိမိ၏ ငွေစာရင်းအကောင့်အသုံးပြုခွင့်ကို မိမိကိုယ်တိုင် ပြောင်းလဲ၍ မရပါ။",
  "Activate this staff account before assigning financial accounts.":
    "ငွေစာရင်းအကောင့်အသုံးပြုခွင့် မပေးမီ ဤဝန်ထမ်းအကောင့်ကို အသုံးပြုနိုင်အောင် ဖွင့်ပါ။",
  Accounting: "စာရင်းကိုင်",
  Actions: "လုပ်ဆောင်ချက်များ",
  Address: "လိပ်စာ",
  Administration: "စီမံခန့်ခွဲရေး",
  Amount: "ပမာဏ",
  "Amount must be greater than zero.": "ပမာဏသည် သုညထက်ကြီးရမည်။",
  Back: "နောက်သို့",
  Balance: "လက်ကျန်",
  "Branding Setting": "အမှတ်တံဆိပ် ဆက်တင်",
  "Built-in": "မူလပါရှိသည်",
  Cancel: "မလုပ်တော့ပါ",
  Change: "ပြန်အမ်းငွေ",
  "Change Password": "စကားဝှက် ပြောင်းရန်",
  City: "မြို့",
  Citizen: "နိုင်ငံသားအမျိုးအစား",
  Close: "ပိတ်ရန်",
  Code: "ကုဒ်",
  Collateral: "အပေါင်ပစ္စည်း",
  Confirm: "အတည်ပြုရန်",
  "Complete NRC or leave it empty.":
    "နိုင်ငံသားစိစစ်ရေးအမှတ်ကို အပြည့်အစုံဖြည့်ပါ သို့မဟုတ် လွတ်ထားပါ။",
  Country: "နိုင်ငံ",
  Created: "ဖန်တီးသည့်ရက်",
  Credit: "အဝင်",
  Custom: "စိတ်ကြိုက်",
  Customers: "ဖောက်သည်များ",
  Dashboard: "ဒက်ရှ်ဘုတ်",
  Date: "ရက်စွဲ",
  Debt: "အကြွေး",
  Debts: "အကြွေးများ",
  Delete: "ဖျက်ရန်",
  "Delete Debt": "အကြွေး ဖျက်ရန်",
  "Delete Expense": "အသုံးစရိတ် ဖျက်ရန်",
  Description: "ဖော်ပြချက်",
  Dismiss: "ဖျောက်ရန်",
  "Dismiss notification": "အသိပေးချက် ဖျောက်ရန်",
  Done: "ပြီးပြီ",
  Download: "ဒေါင်းလုဒ်",
  "Download Excel": "Excel ဒေါင်းလုဒ်",
  Duration: "ကြာချိန်",
  "Duration In Days": "ကြာချိန် (ရက်)",
  Edit: "ပြင်ရန်",
  Email: "အီးမေးလ်",
  English: "English",
  Expenses: "အသုံးစရိတ်များ",
  Finance: "ဘဏ္ဍာရေး",
  Final: "နောက်ဆုံး",
  "General ledger": "အထွေထွေစာရင်း",
  "Generate Ledger": "စာရင်းထုတ်ရန်",
  Guest: "ဧည့်သည်",
  Interest: "အတိုး",
  "Interest Payments": "အတိုးပေးချေမှုများ",
  "Interest Types": "အတိုးအမျိုးအစားများ",
  Language: "ဘာသာစကား",
  Loading: "ဖွင့်နေသည်",
  Logout: "ထွက်ရန်",
  Myanmar: "မြန်မာ",
  Name: "အမည်",
  "NRC is required.": "နိုင်ငံသားစိစစ်ရေးအမှတ် ဖြည့်ရန်လိုအပ်ပါသည်။",
  Next: "ရှေ့သို့",
  "No data": "ဒေတာမရှိပါ",
  "No records found.": "မှတ်တမ်း မတွေ့ပါ။",
  Opening: "အစလက်ကျန်",
  Operations: "လုပ်ငန်းများ",
  Outgoing: "အထွက်",
  Page: "စာမျက်နှာ",
  Paid: "ပေးချေပြီး",
  Password: "စကားဝှက်",
  Phone: "ဖုန်း",
  Previous: "နောက်သို့",
  "Profile Setting": "ပရိုဖိုင် ဆက်တင်",
  Reference: "ရည်ညွှန်းချက်",
  Refresh: "ပြန်ဖွင့်ရန်",
  Redemptions: "ရွေးယူမှုများ",
  Save: "သိမ်းရန်",
  "Save Changes": "ပြောင်းလဲမှုများ သိမ်းရန်",
  Search: "ရှာရန်",
  Settings: "ဆက်တင်များ",
  Slip: "စာချုပ်",
  "Loan Slips": "ချေးငွေစာချုပ်များ",
  Staff: "ဝန်ထမ်းများ",
  Status: "အခြေအနေ",
  State: "တိုင်း/ပြည်နယ်",
  Tag: "တက်ဂ်",
  "Tenant Contact Setting": "ဆိုင် ဆက်သွယ်ရန် ဆက်တင်",
  "Tenant Setting": "ဆိုင် ဆက်တင်",
  "Tenant session": "ဆိုင်အသုံးပြုမှု",
  "Tenant workspace": "ဆိုင်လုပ်ငန်းခွင်",
  Time: "အချိန်",
  Total: "စုစုပေါင်း",
  Trust: "ယုံကြည်မှု",
  "Type Data Setting": "အမျိုးအစား ဒေတာ ဆက်တင်",
  Type: "အမျိုးအစား",
  Township: "မြို့နယ်",
  Unpaid: "မပေးချေရသေး",
  User: "အသုံးပြုသူ",
  Workspace: "လုပ်ငန်းခွင်",
  "Pawn Operations": "အပေါင်လုပ်ငန်းများ",
  "Active workspaces": "အသုံးပြုနေသော လုပ်ငန်းခွင်များ",
  "Server routes mapped": "ဆာဗာလမ်းကြောင်းများ ချိတ်ဆက်ပြီး",
  "Pawn operations": "အပေါင်လုပ်ငန်းများ",
  "Slip lifecycle ready": "စာချုပ် လုပ်ငန်းစဉ် အသင့်",
  "Tenant operations": "ဆိုင်လုပ်ငန်းများ",
  "Staff and finance ready": "ဝန်ထမ်းနှင့် ဘဏ္ဍာရေး အသင့်",
  "Please confirm this action": "ဤလုပ်ဆောင်ချက်ကို အတည်ပြုပါ",
  "Checking session": "အသုံးပြုမှု စစ်ဆေးနေသည်",
  "Please wait": "ခဏစောင့်ပါ",
  "Open navigation": "လမ်းညွှန်မီနူး ဖွင့်ရန်",
  "Close modal": "မော်ဒယ် ပိတ်ရန်",
  "Application sections": "အက်ပ် ကဏ္ဍများ",
  "Main navigation": "အဓိက လမ်းညွှန်",
  "Select UI language": "UI ဘာသာစကား ရွေးရန်",
  "User interface language": "အသုံးပြုသူ မျက်နှာပြင် ဘာသာစကား",
  "Choose the language used for this browser session.":
    "ဤအသုံးပြုမှုအတွက် ဘာသာစကားကို ရွေးပါ။",
  "Accounting effect": "စာရင်းကိုင် သက်ရောက်မှု",
  "Add Jewellery Item": "ရွှေထည်ပစ္စည်း ထည့်ရန်",
  "Add Normal Item": "ပုံမှန်ပစ္စည်း ထည့်ရန်",
  "Back to Settings": "ဆက်တင်များသို့ ပြန်သွားရန်",
  "Calculated from item value, quantity, and jewellery weight where applicable.":
    "ပစ္စည်းတန်ဖိုး၊ အရေအတွက်နှင့် လိုအပ်ပါက ရွှေထည်အလေးချိန်အပေါ် အခြေခံတွက်ချက်သည်။",
  Center: "အလယ်",
  "Choose an item type to start adding collateral.":
    "အပေါင်ပစ္စည်း စထည့်ရန် ပစ္စည်းအမျိုးအစား ရွေးပါ။",
  Clear: "ရှင်းရန်",
  "Collateral Summary": "အပေါင်ပစ္စည်း အကျဉ်းချုပ်",
  "Create New Template": "Template အသစ် ဖန်တီးရန်",
  "Create Slip": "စာချုပ် ဖန်တီးရန်",
  "Create debt if payment is insufficient":
    "ပေးချေငွေ မလုံလောက်ပါက အကြွေး ဖန်တီးရန်",
  Day: "ရက်",
  "Debt Snapshot": "အကြွေး အကျဉ်းချုပ်",
  "Expense records create outgoing accounting entries server-side.":
    "အသုံးစရိတ်မှတ်တမ်းများသည် ဆာဗာတွင် အထွက်စာရင်းများ ဖန်တီးသည်။",
  "Footer Editor": "Footer Editor",
  "Have Gem Stone": "ကျောက်ပါသည်",
  "Header Editor": "Header Editor",
  History: "မှတ်တမ်း",
  "Interest Snapshot": "အတိုး အကျဉ်းချုပ်",
  "Interest payment sections": "အတိုးပေးချေမှု ကဏ္ဍများ",
  Left: "ဘယ်",
  "Load Detail": "အသေးစိတ် ဖွင့်ရန်",
  "Load Slip": "စာချုပ် ဖွင့်ရန်",
  "Loan Application": "ချေးငွေလျှောက်လွှာ",
  "Loan slip sections": "ချေးငွေစာချုပ် ကဏ္ဍများ",
  Management: "စီမံခန့်ခွဲမှု",
  "Minimum Retail Price": "အနည်းဆုံး လက်လီစျေး",
  Month: "လ",
  "No collateral items returned.": "အပေါင်ပစ္စည်းများ မရရှိပါ။",
  "No interest rows returned.": "အတိုးစာကြောင်းများ မရရှိပါ။",
  "No redemption selected.": "ရွေးယူမှု မရွေးထားပါ။",
  "No unpaid debts returned.": "မပေးချေရသေးသော အကြွေးများ မရရှိပါ။",
  Preview: "ကြည့်ရှုရန်",
  "Print after saving": "သိမ်းပြီးပါက ပရင့်ထုတ်ရန်",
  "Record Payment": "ပေးချေမှု မှတ်တမ်းတင်ရန်",
  Redeem: "ရွေးယူရန်",
  Remove: "ဖယ်ရှားရန်",
  "Remove Component": "Component ဖယ်ရှားရန်",
  Reset: "ပြန်စရန်",
  Right: "ညာ",
  "Select a component on the canvas to update its coordinates and sizing.":
    "တည်နေရာနှင့် အရွယ်အစား ပြင်ရန် canvas ပေါ်မှ component တစ်ခုကို ရွေးပါ။",
  "Select interest type": "အတိုးအမျိုးအစား ရွေးပါ",
  "Select material": "ပစ္စည်းအမျိုးအစား ရွေးပါ",
  "Template Editor": "Template Editor",
  View: "ကြည့်ရန်",
  Week: "ပတ်",
  Workflow: "လုပ်ငန်းစဉ်",
  Year: "နှစ်",
  "Accrual Breakdown": "အတိုးတွက်ချက်မှု အသေးစိတ်",
  "Add Customer": "ဖောက်သည် ထည့်ရန်",
  "Add Debt": "အကြွေး ထည့်ရန်",
  "Add Expense": "အသုံးစရိတ် ထည့်ရန်",
  "Add Staff": "ဝန်ထမ်း ထည့်ရန်",
  "All Slips": "စာချုပ်အားလုံး",
  Brand: "အမှတ်တံဆိပ်",
  "Collateral Details": "အပေါင်ပစ္စည်း အသေးစိတ်",
  "Collateral Items": "အပေါင်ပစ္စည်းများ",
  "Collateral required": "အပေါင်ပစ္စည်း လိုအပ်သည်",
  "Completed interest payments will appear here.":
    "ပြီးဆုံးသော အတိုးပေးချေမှုများ ဤနေရာတွင် ပြမည်။",
  "Completed redemptions will appear here.":
    "ပြီးဆုံးသော ရွေးယူမှုများ ဤနေရာတွင် ပြမည်။",
  "Confirm debt recording": "အကြွေးမှတ်တမ်းတင်မှု အတည်ပြုရန်",
  "Confirm type deletion": "အမျိုးအစားဖျက်မှု အတည်ပြုရန်",
  "Current Date": "လက်ရှိရက်စွဲ",
  Customer: "ဖောက်သည်",
  "Customer Details": "ဖောက်သည် အသေးစိတ်",
  "Customer records": "ဖောက်သည်မှတ်တမ်းများ",
  "Debt Amount": "အကြွေးပမာဏ",
  "Debt Payment Result": "အကြွေးပေးချေမှု ရလဒ်",
  "Debt payment failed": "အကြွေးပေးချေမှု မအောင်မြင်ပါ",
  "Default Password": "မူလစကားဝှက်",
  "End Date": "ပြီးဆုံးရက်",
  "Estimated Value": "ခန့်မှန်းတန်ဖိုး",
  "Expense type": "အသုံးစရိတ်အမျိုးအစား",
  "Expire Date": "သက်တမ်းကုန်ရက်",
  "Expiry Quota": "သက်တမ်းပမာဏ",
  "Expiry Unit": "သက်တမ်းယူနစ်",
  "Filter Debts": "အကြွေးများ စစ်ရန်",
  "Filter Expenses": "အသုံးစရိတ်များ စစ်ရန်",
  "Gross Amount": "စုစုပေါင်းပမာဏ",
  "Incoming Transactions Today": "ယနေ့ အဝင်စာရင်းများ",
  "Insufficient payment": "ပေးချေငွေ မလုံလောက်ပါ",
  "Interest Amount": "အတိုးပမာဏ",
  "Interest History": "အတိုးမှတ်တမ်း",
  "Interest Payment Result": "အတိုးပေးချေမှု ရလဒ်",
  "Interest Rate": "အတိုးနှုန်း",
  "Interest Type": "အတိုးအမျိုးအစား",
  "Item Name": "ပစ္စည်းအမည်",
  Jewellery: "ရွှေထည်",
  Kyat: "ကျပ်သား",
  "Loan Amount": "ချေးငွေပမာဏ",
  "Loan Details": "ချေးငွေ အသေးစိတ်",
  "Loan Notes": "ချေးငွေ မှတ်ချက်",
  "Loan slip action failed": "ချေးငွေစာချုပ် လုပ်ဆောင်မှု မအောင်မြင်ပါ",
  "Loan slip lookup failed": "ချေးငွေစာချုပ် ရှာဖွေမှု မအောင်မြင်ပါ",
  "Loan slip updated": "ချေးငွေစာချုပ် ပြင်ဆင်ပြီး",
  Material: "ပစ္စည်းအမျိုးအစား",
  "Material Price per Kyat": "တစ်ကျပ်သား စျေးနှုန်း",
  "Material Type": "ပစ္စည်းအမျိုးအစား",
  "Net Amount": "အသားတင်ပမာဏ",
  "No calculation yet": "တွက်ချက်မှု မရှိသေးပါ",
  "No interest due": "ပေးရန်အတိုး မရှိပါ",
  "No interest payments yet": "အတိုးပေးချေမှု မရှိသေးပါ",
  "No ledger generated": "စာရင်း မထုတ်ရသေးပါ",
  "No redemptions yet": "ရွေးယူမှု မရှိသေးပါ",
  "No slip": "စာချုပ် မရှိပါ",
  "No slips yet": "စာချုပ် မရှိသေးပါ",
  Normal: "ပုံမှန်",
  Note: "မှတ်ချက်",
  Notes: "မှတ်ချက်များ",
  "Outgoing Transactions Today": "ယနေ့ အထွက်စာရင်းများ",
  "Paid Amount": "ပေးချေငွေ",
  Pal: "ပဲ",
  "Payment Amount": "ပေးချေငွေ",
  "Payment Date": "ပေးချေရက်",
  "Payment is insufficient. Submit this payment and create debt for the remaining interest?":
    "ပေးချေငွေ မလုံလောက်ပါ။ ဤပေးချေမှုကို တင်ပြီး ကျန်အတိုးအတွက် အကြွေးဖန်တီးမည်လား။",
  "Payment is less than calculated interest. Confirm debt recording before submitting.":
    "ပေးချေငွေသည် တွက်ချက်ထားသော အတိုးထက်နည်းနေသည်။ မတင်မီ အကြွေးမှတ်တမ်းတင်မှုကို အတည်ပြုပါ။",
  Period: "ကာလ",
  "Print slip": "စာချုပ် ပရင့်ထုတ်ရန်",
  Quantity: "အရေအတွက်",
  "Receive Payment": "ပေးချေငွေ လက်ခံရန်",
  Received: "လက်ခံငွေ",
  "Record Debt": "အကြွေး မှတ်တမ်းတင်ရန်",
  "Redemption Date": "ရွေးယူရက်",
  "Redemption Detail": "ရွေးယူမှု အသေးစိတ်",
  "Redemption History": "ရွေးယူမှု မှတ်တမ်း",
  "Redemption Result": "ရွေးယူမှု ရလဒ်",
  "Redemption action failed": "ရွေးယူမှု လုပ်ဆောင်ချက် မအောင်မြင်ပါ",
  "Redemption sections": "ရွေးယူမှု ကဏ္ဍများ",
  "Redemption updated": "ရွေးယူမှု ပြင်ဆင်ပြီး",
  "Redeemed At": "ရွေးယူသည့်အချိန်",
  "Search customers": "ဖောက်သည်များ ရှာရန်",
  "Search slips": "စာချုပ်များ ရှာရန်",
  "Select a redemption record": "ရွေးယူမှုမှတ်တမ်း ရွေးပါ",
  "Slip Detail": "စာချုပ် အသေးစိတ်",
  "Slip Lookup": "စာချုပ် ရှာဖွေခြင်း",
  "Slip No": "စာချုပ်နံပါတ်",
  "Slip Number or Barcode": "စာချုပ်နံပါတ် သို့မဟုတ် ဘားကုဒ်",
  "Start Date": "စတင်ရက်",
  "Suggested minimum retail total": "အကြံပြု အနည်းဆုံး လက်လီစုစုပေါင်း",
  "Total Amount To Pay": "ပေးချေရမည့် စုစုပေါင်းပမာဏ",
  "Total Interest": "စုစုပေါင်း အတိုး",
  Weight: "အလေးချိန်",
  Yway: "ရွေး",
  "Abort Currency Change": "ငွေကြေးပြောင်းလဲမှု ပယ်ဖျက်ရန်",
  "Abort reporting currency change": "အစီရင်ခံငွေကြေး ပြောင်းလဲမှု ပယ်ဖျက်ရန်",
  "Account action failed": "အကောင့် လုပ်ဆောင်ချက် မအောင်မြင်ပါ",
  "Account Detail": "အကောင့် အသေးစိတ်",
  "Account history failed": "အကောင့်မှတ်တမ်း မအောင်မြင်ပါ",
  "Account not found": "အကောင့် မတွေ့ပါ",
  "Account number": "အကောင့်နံပါတ်",
  "Account Status": "အကောင့်အခြေအနေ",
  "Account transfer completed.": "အကောင့်လွှဲပြောင်းမှု ပြီးစီးပါပြီ။",
  "Account type": "အကောင့်အမျိုးအစား",
  "Accounting action failed": "စာရင်းကိုင် လုပ်ဆောင်ချက် မအောင်မြင်ပါ",
  "Accounting day updated": "စာရင်းကိုင်ရက် အပ်ဒိတ်လုပ်ပြီးပါပြီ",
  "Accounting filters": "စာရင်းကိုင် စစ်ထုတ်မှုများ",
  "Accounting overview": "စာရင်းကိုင် အနှစ်ချုပ်",
  "Accounts updated": "အကောင့်များ အပ်ဒိတ်လုပ်ပြီးပါပြီ",
  "Active Loan Amount": "လက်ရှိချေးငွေပမာဏ",
  "Active Loans": "လက်ရှိချေးငွေများ",
  "Active Pawn Loans": "လက်ရှိအပေါင်ချေးငွေများ",
  "Add another cash, bank, or online payment account.":
    "ငွေသား၊ ဘဏ် သို့မဟုတ် အွန်လိုင်းငွေပေးချေမှု အကောင့်အသစ် ထည့်ပါ။",
  "Add capital": "အရင်းအနှီး ထည့်ရန်",
  "Add Capital": "အရင်းအနှီး ထည့်ရန်",
  "Add Currency": "ငွေကြေး ထည့်ရန်",
  "Add Lender": "ငွေချေးသူ ထည့်ရန်",
  "Admin closing prices": "အက်ဒမင် ပိတ်ဈေးများ",
  "Allocate a payment against this business loan.":
    "ဤလုပ်ငန်းချေးငွေအတွက် ပေးချေမှုကို ခွဲဝေမှတ်တမ်းတင်ပါ။",
  "An active customer with the same email, phone, or NRC already exists.":
    "အီးမေးလ်၊ ဖုန်း သို့မဟုတ် NRC တူညီသော လက်ရှိဖောက်သည် ရှိပြီးသားဖြစ်ပါသည်။",
  "Asset Inflow": "ပိုင်ဆိုင်မှု အဝင်",
  "Assign buying and selling prices and review daily observations and trends.":
    "ဝယ်ဈေး၊ ရောင်းဈေး သတ်မှတ်ပြီး နေ့စဉ်မှတ်တမ်းနှင့် လမ်းကြောင်းများကို စစ်ဆေးပါ။",
  "Assign this account from a staff edit page.":
    "ဤအကောင့်ကို ဝန်ထမ်းပြင်ဆင်စာမျက်နှာမှ ချထားပါ။",
  "Assigned Staff": "ချထားသော ဝန်ထမ်းများ",
  "Average Loan Term": "ပျမ်းမျှချေးငွေကာလ",
  "Avg. Trust Score": "ပျမ်းမျှယုံကြည်မှုအမှတ်",
  "Bad Repayment History Count": "မကောင်းသော ပြန်ဆပ်မှတ်တမ်း အရေအတွက်",
  "Base currency": "အခြေခံငွေကြေး",
  "Before finalizing": "အပြီးသတ်မီ",
  "Built-in platform currencies are read-only. Tenant currencies can be maintained here.":
    "စနစ်ပါငွေကြေးများကို ဖတ်ရန်သာရပြီး ဆိုင်ငွေကြေးများကို ဤနေရာတွင် ထိန်းသိမ်းနိုင်ပါသည်။",
  "Business funding profile": "လုပ်ငန်းရန်ပုံငွေ ပရိုဖိုင်",
  "Business loan action failed": "လုပ်ငန်းချေးငွေ လုပ်ဆောင်ချက် မအောင်မြင်ပါ",
  "Business loan compound schedule saved.":
    "လုပ်ငန်းချေးငွေ အတိုးပေါင်းထည့် အချိန်ဇယား သိမ်းပြီးပါပြီ။",
  "Business loan deleted successfully.": "လုပ်ငန်းချေးငွေ ဖျက်ပြီးပါပြီ။",
  "Business Loan Detail": "လုပ်ငန်းချေးငွေ အသေးစိတ်",
  "Business Loan Payment": "လုပ်ငန်းချေးငွေ ပေးချေမှု",
  "Business loan payment recorded.":
    "လုပ်ငန်းချေးငွေ ပေးချေမှု မှတ်တမ်းတင်ပြီးပါပြီ။",
  "Business loan records": "လုပ်ငန်းချေးငွေ မှတ်တမ်းများ",
  "Business loan updated": "လုပ်ငန်းချေးငွေ အပ်ဒိတ်လုပ်ပြီးပါပြီ",
  "Business Loans": "လုပ်ငန်းချေးငွေများ",
  "Buying price": "ဝယ်ဈေး",
  "Calculate a slip before redeeming.": "ရွေးယူမီ စာချုပ်ကို တွက်ချက်ပါ။",
  "Calculate redemption totals, receive payment, and review redemption records.":
    "ရွေးယူရန် စုစုပေါင်းကို တွက်ချက်၊ ငွေလက်ခံပြီး ရွေးယူမှုမှတ်တမ်းများကို စစ်ဆေးပါ။",
  "Capital action failed": "အရင်းအနှီး လုပ်ဆောင်ချက် မအောင်မြင်ပါ",
  "Capital details": "အရင်းအနှီး အသေးစိတ်",
  "capital entry": "အရင်းအနှီးမှတ်တမ်း",
  "Capital Management": "အရင်းအနှီး စီမံခန့်ခွဲမှု",
  "Capital records create incoming accounting entries server-side.":
    "အရင်းအနှီးမှတ်တမ်းများသည် ဆာဗာဘက်တွင် အဝင်စာရင်းများ ဖန်တီးပါသည်။",
  "Capitalize outstanding interest into the business loan principal.":
    "မပေးချေရသေးသော အတိုးကို လုပ်ငန်းချေးငွေ မူရင်းထဲသို့ ပေါင်းထည့်ပါ။",
  "Cash Available": "ရရှိနိုင်သော ငွေသား",
  "Changes update the shared customer and lender identity.":
    "ပြောင်းလဲမှုများသည် မျှဝေထားသော ဖောက်သည်နှင့် ငွေချေးသူ အချက်အလက်ကို အပ်ဒိတ်လုပ်ပါသည်။",
  "Chart series": "ဇယားစီးရီး",
  "Choose a pair and enter buying and selling prices.":
    "ငွေကြေးအတွဲကို ရွေးပြီး ဝယ်ဈေးနှင့် ရောင်းဈေး ထည့်ပါ။",
  "Choose base and quote currencies.": "အခြေခံနှင့် ကိုးကားငွေကြေးကို ရွေးပါ။",
  "Choose both start date and end date.":
    "စတင်ရက်နှင့် ပြီးဆုံးရက် နှစ်ခုလုံးကို ရွေးပါ။",
  "Choose different accounts and enter valid transfer values.":
    "ကွဲပြားသော အကောင့်များကို ရွေးပြီး မှန်ကန်သော လွှဲပြောင်းတန်ဖိုးများ ထည့်ပါ။",
  "Clear or change the filters to see more results.":
    "ရလဒ်များ ပိုမိုကြည့်ရန် စစ်ထုတ်မှုများကို ရှင်းပါ သို့မဟုတ် ပြောင်းပါ။",
  "Close accounting day": "စာရင်းကိုင်ရက် ပိတ်ရန်",
  "Close Accounting Day": "စာရင်းကိုင်ရက် ပိတ်ရန်",
  "Close detail view": "အသေးစိတ်မြင်ကွင်း ပိတ်ရန်",
  "Code, name, or account number": "ကုဒ်၊ အမည် သို့မဟုတ် အကောင့်နံပါတ်",
  "Collateral category donut chart": "အပေါင်အမျိုးအစား ဒိုးနတ်ဇယား",
  "Collateral Items Needing Review": "စစ်ဆေးရန်လိုသော အပေါင်ပစ္စည်းများ",
  "Collateral Situation": "အပေါင်အခြေအနေ",
  "Collateral values, LTV, and items that need review.":
    "အပေါင်တန်ဖိုးများ၊ LTV နှင့် စစ်ဆေးရန်လိုသော ပစ္စည်းများ။",
  "Compound schedule": "အတိုးပေါင်းထည့် အချိန်ဇယား",
  "Configure explicit base and quote currency directions.":
    "အခြေခံနှင့် ကိုးကားငွေကြေး ဦးတည်ချက်များကို တိတိကျကျ သတ်မှတ်ပါ။",
  "Confirm business loan deletion": "လုပ်ငန်းချေးငွေ ဖျက်မှု အတည်ပြုရန်",
  "Confirm customer deletion": "ဖောက်သည် ဖျက်မှု အတည်ပြုရန်",
  "Confirm historical rates": "သမိုင်းဝင်နှုန်းထားများ အတည်ပြုရန်",
  "Confirm lender deletion": "ငွေချေးသူ ဖျက်မှု အတည်ပြုရန်",
  "Contact Details": "ဆက်သွယ်ရန် အသေးစိတ်",
  "Correction reason": "ပြင်ဆင်ရသည့် အကြောင်းရင်း",
  "Create a business loan to record lender funding.":
    "ငွေချေးသူရန်ပုံငွေ မှတ်တမ်းတင်ရန် လုပ်ငန်းချေးငွေ ဖန်တီးပါ။",
  "Create a customer record before using it in loan slip workflows.":
    "ချေးငွေစာချုပ်လုပ်ငန်းစဉ်တွင် အသုံးမပြုမီ ဖောက်သည်မှတ်တမ်း ဖန်တီးပါ။",
  "Create a lender to begin recording business funding.":
    "လုပ်ငန်းရန်ပုံငွေ မှတ်တမ်းတင်ရန် ငွေချေးသူ ဖန်တီးပါ။",
  "Create a shared person profile for business loan funding.":
    "လုပ်ငန်းချေးငွေ ရန်ပုံငွေအတွက် လူပုဂ္ဂိုလ်ပရိုဖိုင် ဖန်တီးပါ။",
  "Create an active direct or reverse exchange pair for every requested currency direction.":
    "လိုအပ်သော ငွေကြေးဦးတည်ချက်တိုင်းအတွက် လက်ရှိတိုက်ရိုက် သို့မဟုတ် ပြောင်းပြန် ငွေလဲအတွဲ ဖန်တီးပါ။",
  "Create Business Loan": "လုပ်ငန်းချေးငွေ ဖန်တီးရန်",
  "Create failed": "ဖန်တီးမှု မအောင်မြင်ပါ",
  "Create Financial Account": "ငွေစာရင်းအကောင့် ဖန်တီးရန်",
  "Create Lender": "ငွေချေးသူ ဖန်တီးရန်",
  "Create the first customer record.": "ပထမဆုံး ဖောက်သည်မှတ်တမ်း ဖန်တီးပါ။",
  "Created By": "ဖန်တီးသူ",
  "Creation failed": "ဖန်တီးမှု မအောင်မြင်ပါ",
  "Currencies updated": "ငွေကြေးများ အပ်ဒိတ်လုပ်ပြီးပါပြီ",
  "Currency action failed": "ငွေကြေး လုပ်ဆောင်ချက် မအောင်မြင်ပါ",
  "Currency code and name are required.": "ငွေကြေးကုဒ်နှင့် အမည် လိုအပ်ပါသည်။",
  "Currency Management": "ငွေကြေး စီမံခန့်ခွဲမှု",
  "Currency set inactive.": "ငွေကြေးကို အသုံးမပြုတော့ပါ။",
  "Current accounting day": "လက်ရှိ စာရင်းကိုင်ရက်",
  "Current principal and accrued interest.":
    "လက်ရှိ မူရင်းနှင့် တိုးလာသော အတိုး။",
  "Customer action failed": "ဖောက်သည် လုပ်ဆောင်ချက် မအောင်မြင်ပါ",
  "Customer created": "ဖောက်သည် ဖန်တီးပြီးပါပြီ",
  "Customer created successfully.": "ဖောက်သည် ဖန်တီးပြီးပါပြီ။",
  "Customer deleted": "ဖောက်သည် ဖျက်ပြီးပါပြီ",
  "Customer deleted successfully.": "ဖောက်သည် ဖျက်ပြီးပါပြီ။",
  "Customer detail breadcrumb": "ဖောက်သည်အသေးစိတ် လမ်းကြောင်း",
  "Customer lookup failed": "ဖောက်သည် ရှာဖွေမှု မအောင်မြင်ပါ",
  "Customer Name": "ဖောက်သည်အမည်",
  "Customer profile": "ဖောက်သည်ပရိုဖိုင်",
  "Customer records hidden": "ဖောက်သည်မှတ်တမ်းများ ဖျောက်ထားသည်",
  "Customer registry": "ဖောက်သည်စာရင်း",
  "Customer updated": "ဖောက်သည် အပ်ဒိတ်လုပ်ပြီးပါပြီ",
  "Customer updated successfully.": "ဖောက်သည် အပ်ဒိတ်လုပ်ပြီးပါပြီ။",
  "Customer was not found.": "ဖောက်သည် မတွေ့ပါ။",
  "Daily Rate Assignment": "နေ့စဉ်နှုန်းထား သတ်မှတ်ခြင်း",
  "Dashboard data is not available yet.": "ဒက်ရှ်ဘုတ်ဒေတာ မရရှိသေးပါ။",
  "Dashboard failed to load": "ဒက်ရှ်ဘုတ် ဖွင့်မရပါ",
  "Date range": "ရက်အပိုင်းအခြား",
  "Destination receives": "လက်ခံမည့် အကောင့်ရရှိမည့်ငွေ",
  "Direction is explicit: one base currency equals the entered rate in quote currency.":
    "ဦးတည်ချက်ကို တိတိကျကျ သတ်မှတ်ထားသည်။ အခြေခံငွေကြေး ၁ ခုသည် ကိုးကားငွေကြေးဖြင့် ထည့်ထားသောနှုန်းနှင့် ညီသည်။",
  "Download ledger": "စာရင်းဒေါင်းလုဒ်ရန်",
  "Edit Account": "အကောင့် ပြင်ရန်",
  "Edit Business Loan": "လုပ်ငန်းချေးငွေ ပြင်ရန်",
  "Edit Currency": "ငွေကြေး ပြင်ရန်",
  "Edit Customer": "ဖောက်သည် ပြင်ရန်",
  "Edit Lender": "ငွေချေးသူ ပြင်ရန်",
  "Edit lender details": "ငွေချေးသူအသေးစိတ် ပြင်ရန်",
  "End date": "ပြီးဆုံးရက်",
  "Enter opening prices before accepting same-day transactions.":
    "ယနေ့စာရင်းများ လက်ခံမီ အဖွင့်ဈေးများ ထည့်ပါ။",
  "Exchange pair action failed": "ငွေလဲအတွဲ လုပ်ဆောင်ချက် မအောင်မြင်ပါ",
  "Exchange pair created.": "ငွေလဲအတွဲ ဖန်တီးပြီးပါပြီ။",
  "Exchange pair deleted.": "ငွေလဲအတွဲ ဖျက်ပြီးပါပြီ။",
  "Exchange pairs updated": "ငွေလဲအတွဲများ အပ်ဒိတ်လုပ်ပြီးပါပြီ",
  "Exchange Pair Management": "ငွေလဲအတွဲ စီမံခန့်ခွဲမှု",
  "Exchange Pairs": "ငွေလဲအတွဲများ",
  "Financial Accounts": "ငွေစာရင်းအကောင့်များ",
  "Filter transactions": "စာရင်းများ စစ်ထုတ်ရန်",
  "Find customers by identity, contact, and trust signals.":
    "အချက်အလက်၊ ဆက်သွယ်ရန်နှင့် ယုံကြည်မှုအမှတ်များဖြင့် ဖောက်သည်များ ရှာပါ။",
  "Find lenders by name, phone, or notes.":
    "အမည်၊ ဖုန်း သို့မဟုတ် မှတ်ချက်များဖြင့် ငွေချေးသူများ ရှာပါ။",
  "From date": "စတင်ရက်",
  "Full settlement": "အပြည့်အဝ ပေးချေမှု",
  "Generate ledger": "စာရင်းထုတ်ရန်",
  "Historical Rates": "သမိုင်းဝင်နှုန်းထားများ",
  "Ledger Report": "စာရင်းအစီရင်ခံစာ",
  "Lender action failed": "ငွေချေးသူ လုပ်ဆောင်ချက် မအောင်မြင်ပါ",
  "Lender deleted": "ငွေချေးသူ ဖျက်ပြီးပါပြီ",
  "Lender deleted successfully.": "ငွေချေးသူ ဖျက်ပြီးပါပြီ။",
  "Lender details": "ငွေချေးသူ အသေးစိတ်",
  "Lender records": "ငွေချေးသူ မှတ်တမ်းများ",
  "Lender registry": "ငွေချေးသူစာရင်း",
  "Lender updated": "ငွေချေးသူ အပ်ဒိတ်လုပ်ပြီးပါပြီ",
  Lenders: "ငွေချေးသူများ",
  "Loan portfolio": "ချေးငွေစုစည်းမှု",
  "Manage cash, bank, and online payment balances.":
    "ငွေသား၊ ဘဏ်နှင့် အွန်လိုင်းငွေပေးချေမှု လက်ကျန်များကို စီမံပါ။",
  "Manage platform and tenant currencies used throughout financial operations.":
    "ငွေကြေးလုပ်ငန်းများတစ်လျှောက် အသုံးပြုသည့် စနစ်နှင့် ဆိုင်ငွေကြေးများကို စီမံပါ။",
  "No business loans": "လုပ်ငန်းချေးငွေ မရှိပါ",
  "No business loans match this search.":
    "ဤရှာဖွေမှုနှင့် ကိုက်ညီသော လုပ်ငန်းချေးငွေ မရှိပါ။",
  "No customers": "ဖောက်သည် မရှိပါ",
  "No customers match this search.":
    "ဤရှာဖွေမှုနှင့် ကိုက်ညီသော ဖောက်သည် မရှိပါ။",
  "No exchange pairs": "ငွေလဲအတွဲ မရှိပါ",
  "No financial accounts": "ငွေစာရင်းအကောင့် မရှိပါ",
  "No lenders match this search.":
    "ဤရှာဖွေမှုနှင့် ကိုက်ညီသော ငွေချေးသူ မရှိပါ။",
  "No lenders yet": "ငွေချေးသူ မရှိသေးပါ",
  "No matching customers": "ကိုက်ညီသော ဖောက်သည် မရှိပါ",
  "No matching lenders": "ကိုက်ညီသော ငွေချေးသူ မရှိပါ",
  "No matching loans": "ကိုက်ညီသော ချေးငွေ မရှိပါ",
  "No matching transactions": "ကိုက်ညီသော စာရင်း မရှိပါ",
  "No payments": "ပေးချေမှု မရှိပါ",
  "No transactions": "စာရင်း မရှိပါ",
  "Only compatible accounts are available.":
    "ကိုက်ညီသော အကောင့်များသာ ရရှိနိုင်ပါသည်။",
  "Outstanding Balance": "ကျန်ရှိလက်ကျန်",
  "Payment Account": "ပေးချေမည့် အကောင့်",
  "Payment failed": "ပေးချေမှု မအောင်မြင်ပါ",
  "Payment History": "ပေးချေမှုမှတ်တမ်း",
  "Payment recorded": "ပေးချေမှု မှတ်တမ်းတင်ပြီးပါပြီ",
  "Payments recorded against this loan.":
    "ဤချေးငွေအတွက် မှတ်တမ်းတင်ထားသော ပေးချေမှုများ။",
  "Payments will appear here after they are recorded.":
    "ပေးချေမှုများ မှတ်တမ်းတင်ပြီးပါက ဤနေရာတွင် ပေါ်လာပါမည်။",
  "Payments will appear here.": "ပေးချေမှုများ ဤနေရာတွင် ပေါ်လာပါမည်။",
  "Principal balance": "မူရင်းလက်ကျန်",
  "Quote currency": "ကိုးကားငွေကြေး",
  "Receiving Account": "လက်ခံမည့် အကောင့်",
  "Record capital against an assigned financial account.":
    "ချထားသော ငွေစာရင်းအကောင့်အပေါ် အရင်းအနှီး မှတ်တမ်းတင်ပါ။",
  "Record Details": "မှတ်တမ်း အသေးစိတ်",
  "Record money received from a lender as a liability.":
    "ငွေချေးသူထံမှ ရရှိသောငွေကို တာဝန်ရှိငွေအဖြစ် မှတ်တမ်းတင်ပါ။",
  "Record owner or shop capital and keep its accounting impact traceable.":
    "ပိုင်ရှင် သို့မဟုတ် ဆိုင်အရင်းအနှီးကို မှတ်တမ်းတင်ပြီး စာရင်းသက်ရောက်မှုကို ခြေရာခံနိုင်အောင်ထားပါ။",
  "Record payment": "ပေးချေမှု မှတ်တမ်းတင်ရန်",
  "Record the received amount, receiving account, and final redemption details.":
    "လက်ခံငွေ၊ လက်ခံအကောင့်နှင့် နောက်ဆုံးရွေးယူမှုအသေးစိတ်များကို မှတ်တမ်းတင်ပါ။",
  "Redemption summary": "ရွေးယူမှု အနှစ်ချုပ်",
  "Refresh customer records": "ဖောက်သည်မှတ်တမ်းများ ပြန်ဖွင့်ရန်",
  "Refresh lender records": "ငွေချေးသူမှတ်တမ်းများ ပြန်ဖွင့်ရန်",
  "Reporting currency update pending":
    "အစီရင်ခံငွေကြေး အပ်ဒိတ် စောင့်ဆိုင်းနေသည်",
  "Required Historical Rates": "လိုအပ်သော သမိုင်းဝင်နှုန်းထားများ",
  "Residential Address": "နေထိုင်ရာလိပ်စာ",
  "Review account information and immutable transaction history.":
    "အကောင့်အချက်အလက်နှင့် မပြောင်းလဲနိုင်သော စာရင်းမှတ်တမ်းကို စစ်ဆေးပါ။",
  "Risk Flagged": "အန္တရာယ် သတ်မှတ်ထားသည်",
  "Risk Level": "အန္တရာယ်အဆင့်",
  "Risk Situation": "အန္တရာယ်အခြေအနေ",
  "Save Currency": "ငွေကြေး သိမ်းရန်",
  "Search accounts": "အကောင့်များ ရှာရန်",
  "Search ledger": "စာရင်း ရှာရန်",
  "Search lenders": "ငွေချေးသူများ ရှာရန်",
  "Selling price": "ရောင်းဈေး",
  "Set inactive": "အသုံးမပြုတော့ရန်",
  "Set Opening Prices": "အဖွင့်ဈေး သတ်မှတ်ရန်",
  "Set today's opening prices": "ယနေ့အဖွင့်ဈေး သတ်မှတ်ရန်",
  "Shop capital": "ဆိုင်အရင်းအနှီး",
  "Slip details": "စာချုပ်အသေးစိတ်",
  "Source Account": "မူလအကောင့်",
  "Start date": "စတင်ရက်",
  "Submit Permanent Rates": "အမြဲတမ်းနှုန်းထားများ တင်သွင်းရန်",
  "Supply only the exact dates requested by the reporting currency recalculation.":
    "အစီရင်ခံငွေကြေး ပြန်တွက်ချက်မှုက တောင်းထားသော ရက်များကိုသာ ဖြည့်ပါ။",
  "Tenant closing prices": "ဆိုင် ပိတ်ဈေးများ",
  "Tenant currency": "ဆိုင်ငွေကြေး",
  "Tenant pair": "ဆိုင်ငွေလဲအတွဲ",
  "Tenant rate": "ဆိုင်နှုန်းထား",
  "The first financial transaction will open today’s accounting day.":
    "ပထမဆုံး ငွေကြေးစာရင်းသည် ယနေ့စာရင်းကိုင်ရက်ကို ဖွင့်ပါမည်။",
  "The request could not be completed.": "တောင်းဆိုချက်ကို ဆောင်ရွက်၍ မရပါ။",
  "This financial account is unavailable.":
    "ဤငွေစာရင်းအကောင့်ကို မရရှိနိုင်ပါ။",
  "This lender is unavailable.": "ဤငွေချေးသူကို မရရှိနိုင်ပါ။",
  "To date": "ပြီးဆုံးရက်",
  "To date must be on or after from date.":
    "ပြီးဆုံးရက်သည် စတင်ရက်နှင့်တူ သို့မဟုတ် နောက်ကျရပါမည်။",
  "Total Clients": "ဖောက်သည်စုစုပေါင်း",
  "Total Collateral Value": "အပေါင်တန်ဖိုး စုစုပေါင်း",
  "Total Expenses": "အသုံးစရိတ် စုစုပေါင်း",
  "Total Income": "ဝင်ငွေ စုစုပေါင်း",
  "Total Interest Paid": "ပေးချေပြီး အတိုးစုစုပေါင်း",
  "Total Liquid Capital": "လက်လွယ်ငွေအရင်းအနှီး စုစုပေါင်း",
  "Total Loans": "ချေးငွေစုစုပေါင်း",
  "Total outstanding": "ကျန်ရှိငွေ စုစုပေါင်း",
  "Total source deduction": "မူလအကောင့်မှ ဖြတ်မည့်စုစုပေါင်း",
  "Track lender funding, interest expense, and repayments.":
    "ငွေချေးသူရန်ပုံငွေ၊ အတိုးအသုံးစရိတ်နှင့် ပြန်ဆပ်မှုများကို ခြေရာခံပါ။",
  "Transaction History": "စာရင်းမှတ်တမ်း",
  "Transaction ID": "စာရင်းနံပါတ်",
  "Transactions posted to this account will appear here.":
    "ဤအကောင့်တွင် တင်ထားသော စာရင်းများ ဤနေရာတွင် ပေါ်လာပါမည်။",
  "Transfer Between Accounts": "အကောင့်အချင်းချင်း လွှဲပြောင်းရန်",
  "Transfer complete": "လွှဲပြောင်းမှု ပြီးစီးပါပြီ",
  "Transfer Details": "လွှဲပြောင်းမှု အသေးစိတ်",
  "Transfer failed": "လွှဲပြောင်းမှု မအောင်မြင်ပါ",
  "Trend period": "လမ်းကြောင်းကာလ",
  "Trust Score": "ယုံကြည်မှုအမှတ်",
  "Type, reference, or note": "အမျိုးအစား၊ ရည်ညွှန်းချက် သို့မဟုတ် မှတ်ချက်",
  "Unable to calculate redemption.": "ရွေးယူမှု တွက်ချက်၍ မရပါ။",
  "Unable to close the accounting day.": "စာရင်းကိုင်ရက် ပိတ်၍ မရပါ။",
  "Unable to complete transfer.": "လွှဲပြောင်းမှု ပြီးမြောက်၍ မရပါ။",
  "Unable to compound interest.": "အတိုးပေါင်းထည့်၍ မရပါ။",
  "Unable to create business loan.": "လုပ်ငန်းချေးငွေ ဖန်တီး၍ မရပါ။",
  "Unable to create customer.": "ဖောက်သည် ဖန်တီး၍ မရပါ။",
  "Unable to create financial account.": "ငွေစာရင်းအကောင့် ဖန်တီး၍ မရပါ။",
  "Unable to create lender.": "ငွေချေးသူ ဖန်တီး၍ မရပါ။",
  "Unable to delete business loan.": "လုပ်ငန်းချေးငွေ ဖျက်၍ မရပါ။",
  "Unable to delete customer.": "ဖောက်သည် ဖျက်၍ မရပါ။",
  "Unable to delete financial account.": "ငွေစာရင်းအကောင့် ဖျက်၍ မရပါ။",
  "Unable to delete lender.": "ငွေချေးသူ ဖျက်၍ မရပါ။",
  "Unable to download ledger report.": "စာရင်းအစီရင်ခံစာ ဒေါင်းလုဒ်လုပ်၍ မရပါ။",
  "Unable to load account options.": "အကောင့်ရွေးချယ်စရာများ ဖွင့်၍ မရပါ။",
  "Unable to load accounting ledger.": "စာရင်းကိုင်စာရင်း ဖွင့်၍ မရပါ။",
  "Unable to load business loan.": "လုပ်ငန်းချေးငွေ ဖွင့်၍ မရပါ။",
  "Unable to load business loans.": "လုပ်ငန်းချေးငွေများ ဖွင့်၍ မရပါ။",
  "Unable to load capital record.": "အရင်းအနှီးမှတ်တမ်း ဖွင့်၍ မရပါ။",
  "Unable to load customer.": "ဖောက်သည် ဖွင့်၍ မရပါ။",
  "Unable to load customers.": "ဖောက်သည်များ ဖွင့်၍ မရပါ။",
  "Unable to load dashboard summary.": "ဒက်ရှ်ဘုတ်အနှစ်ချုပ် ဖွင့်၍ မရပါ။",
  "Unable to load financial account.": "ငွေစာရင်းအကောင့် ဖွင့်၍ မရပါ။",
  "Unable to load financial accounts.": "ငွေစာရင်းအကောင့်များ ဖွင့်၍ မရပါ။",
  "Unable to load lender.": "ငွေချေးသူ ဖွင့်၍ မရပါ။",
  "Unable to load lenders.": "ငွေချေးသူများ ဖွင့်၍ မရပါ။",
  "Unable to load payment details.": "ပေးချေမှုအသေးစိတ် ဖွင့်၍ မရပါ။",
  "Unable to load redemption history.": "ရွေးယူမှုမှတ်တမ်း ဖွင့်၍ မရပါ။",
  "Unable to load transaction history.": "စာရင်းမှတ်တမ်း ဖွင့်၍ မရပါ။",
  "Unable to load transfer data.": "လွှဲပြောင်းမှုဒေတာ ဖွင့်၍ မရပါ။",
  "Unable to record payment.": "ပေးချေမှု မှတ်တမ်းတင်၍ မရပါ။",
  "Unable to redeem slip.": "စာချုပ် ရွေးယူ၍ မရပါ။",
  "Unable to save capital record.": "အရင်းအနှီးမှတ်တမ်း သိမ်း၍ မရပါ။",
  "Unable to save compound schedule.":
    "အတိုးပေါင်းထည့် အချိန်ဇယား သိမ်း၍ မရပါ။",
  "Unable to update business loan.": "လုပ်ငန်းချေးငွေ အပ်ဒိတ်လုပ်၍ မရပါ။",
  "Unable to update customer.": "ဖောက်သည် အပ်ဒိတ်လုပ်၍ မရပါ။",
  "Unable to update financial account.": "ငွေစာရင်းအကောင့် အပ်ဒိတ်လုပ်၍ မရပါ။",
  "Unable to update lender.": "ငွေချေးသူ အပ်ဒိတ်လုပ်၍ မရပါ။",
  "Unknown currency": "မသိသောငွေကြေး",
  "Update contact details, trust score, and internal notes.":
    "ဆက်သွယ်ရန်အသေးစိတ်၊ ယုံကြည်မှုအမှတ်နှင့် အတွင်းမှတ်ချက်များကို အပ်ဒိတ်လုပ်ပါ။",
  "Update current prices": "လက်ရှိဈေးများ အပ်ဒိတ်လုပ်ရန်",
  "Update failed": "အပ်ဒိတ် မအောင်မြင်ပါ",
  "Update Financial Account": "ငွေစာရင်းအကောင့် အပ်ဒိတ်လုပ်ရန်",
  "Update Prices": "ဈေးနှုန်းများ အပ်ဒိတ်လုပ်ရန်",
  "Verified against ledger": "စာရင်းနှင့် စစ်ဆေးပြီး",
  "View lender": "ငွေချေးသူ ကြည့်ရန်",
  "Your account can create customers, but cannot view customer records.":
    "သင့်အကောင့်သည် ဖောက်သည်များ ဖန်တီးနိုင်သော်လည်း ဖောက်သည်မှတ်တမ်းများ မကြည့်နိုင်ပါ။",
};

const moduleTranslations: Record<
  string,
  { description: string; label: string }
> = {
  accounting: {
    description:
      "ဘဏ္ဍာရေးလုပ်ဆောင်ချက်များမှ ဖန်တီးထားသော ဝင်ငွေနှင့် အသုံးစရိတ် စာရင်းများ။",
    label: "စာရင်းကိုင်",
  },
  collateral: {
    description:
      "ရွှေထည်နှင့် ပုံမှန် အပေါင်ပစ္စည်းများကို ရှာဖွေပြီး အခြေအနေ စစ်ဆေးရန်။",
    label: "အပေါင်ပစ္စည်း",
  },
  customers: {
    description:
      "ဖောက်သည်ရှာဖွေမှု၊ ကိုယ်ရေးအချက်အလက်နှင့် ဖျက်သိမ်းမှု လုပ်ငန်းစဉ်။",
    label: "ဖောက်သည်များ",
  },
  debts: {
    description: "မပေးချေရသေးသော အတိုးနှင့် အခြားအကြွေး မှတ်တမ်းများ။",
    label: "အကြွေးများ",
  },
  expenses: {
    description:
      "စာရင်းကိုင်မှတ်တမ်းနှင့် ချိတ်ဆက်သော ဆိုင်အသုံးစရိတ် မှတ်တမ်းများ။",
    label: "အသုံးစရိတ်များ",
  },
  interest: {
    description:
      "အတိုးတွက်ချက်မှု၊ ပေးချေမှုတင်ခြင်းနှင့် မပေးချေရသေးသော အကြွေးစီမံခြင်း။",
    label: "အတိုးပေးချေမှုများ",
  },
  redemptions: {
    description:
      "ရွေးယူငွေတွက်ချက်မှု၊ အပေါင်ပစ္စည်း ပြန်လွှတ်မှုနှင့် ရွေးယူမှုမှတ်တမ်းများ။",
    label: "ရွေးယူမှုများ",
  },
  settings: {
    description:
      "ဆိုင်ဆက်တင်၊ အမှတ်တံဆိပ်နှင့် စာချုပ်စာရွက် ဒီဇိုင်းထိန်းချုပ်မှုများ။",
    label: "ဆက်တင်များ",
  },
  slips: {
    description:
      "အပေါင်စာချုပ် ဖန်တီးမှု၊ ရှာဖွေမှု၊ စာရွက် preview နှင့် မှတ်တမ်း။",
    label: "ချေးငွေစာချုပ်များ",
  },
  staff: {
    description: "ဆိုင်ဝန်ထမ်းအကောင့်များ၊ ရာထူးများနှင့် ခွင့်ပြုချက်များ။",
    label: "ဝန်ထမ်းများ",
  },
};

export function useUiLocale() {
  const { locale, setLocale } = useTenantSession();

  return {
    locale,
    setLocale,
    t: (text: string, params?: TranslateParams) =>
      translateUiText(locale, text, params),
  };
}

export function translateUiText(
  locale: UiLocale,
  text: string,
  params?: TranslateParams,
): string {
  const resolvedText = params ? interpolate(text, params) : text;

  if (locale === "en") {
    return resolvedText;
  }

  return (
    mmTranslations[resolvedText] ??
    translateDynamicMm(resolvedText) ??
    resolvedText
  );
}

export function translateNode(node: ReactNode, locale: UiLocale): ReactNode {
  return typeof node === "string" ? translateUiText(locale, node) : node;
}

export function getLocalizedModule(module: ModuleDefinition, locale: UiLocale) {
  if (locale === "en") {
    return module;
  }

  const localized = moduleTranslations[module.id];

  return localized ? { ...module, ...localized } : module;
}

export function LocaleSwitcher({ id = "ui-locale" }: { id?: string }) {
  const { locale, setLocale, t } = useUiLocale();

  return (
    <div
      className="locale-switcher"
      role="group"
      aria-label={t("Select UI language")}
    >
      {uiLocaleOptions.map((option) => (
        <button
          aria-pressed={locale === option.locale}
          className={locale === option.locale ? "is-active" : undefined}
          key={option.locale}
          onClick={() => setLocale(option.locale)}
          type="button"
        >
          <span>{t(option.label)}</span>
          <small>{option.nativeLabel}</small>
        </button>
      ))}
      <input id={id} type="hidden" value={locale} readOnly />
    </div>
  );
}

export function LocalizedText({ text }: { text: string }) {
  const { t } = useUiLocale();

  return <>{t(text)}</>;
}

function interpolate(text: string, params: TranslateParams) {
  return Object.entries(params).reduce(
    (current, [key, value]) => current.replaceAll(`{${key}}`, String(value)),
    text,
  );
}

function translateDynamicMm(text: string): string | null {
  const pageMatch = text.match(/^Page (\d+) of (\d+)(?: - (\d+) records)?$/);
  if (pageMatch) {
    return pageMatch[3]
      ? `စာမျက်နှာ ${pageMatch[1]} / ${pageMatch[2]} - မှတ်တမ်း ${pageMatch[3]} ခု`
      : `စာမျက်နှာ ${pageMatch[1]} / ${pageMatch[2]}`;
  }

  const totalMatch = text.match(/^(\d+) total ([A-Za-z ]+?)(s)?$/);
  if (totalMatch) {
    return `စုစုပေါင်း ${translateUiText("mm", totalMatch[2])} ${totalMatch[1]} ခု`;
  }

  const deleteMatch = text.match(
    /^Delete (.+)\? This action cannot be undone\.$/,
  );
  if (deleteMatch) {
    return `${deleteMatch[1]} ကို ဖျက်မည်လား။ ဤလုပ်ဆောင်ချက်ကို ပြန်ပြင်၍မရပါ။`;
  }

  const editMatch = text.match(/^Edit (.+)$/);
  if (editMatch) {
    return `${editMatch[1]} ပြင်ရန်`;
  }

  const workspaceMatch = text.match(/^(.+) workspace$/);
  if (workspaceMatch) {
    return `${workspaceMatch[1]} လုပ်ငန်းခွင်`;
  }

  const suggestedRetailMatch = text.match(
    /^Suggested minimum retail total: (.+)$/,
  );
  if (suggestedRetailMatch) {
    return `အကြံပြု အနည်းဆုံး လက်လီစုစုပေါင်း: ${suggestedRetailMatch[1]}`;
  }

  const daysAgoMatch = text.match(/^(\d+) days ago$/);
  if (daysAgoMatch) {
    return `လွန်ခဲ့သော ${daysAgoMatch[1]} ရက်`;
  }

  const hoursAgoMatch = text.match(/^(\d+) hr(s)? ago$/);
  if (hoursAgoMatch) {
    return `လွန်ခဲ့သော ${hoursAgoMatch[1]} နာရီ`;
  }

  const minutesAgoMatch = text.match(/^(\d+) min ago$/);
  if (minutesAgoMatch) {
    return `လွန်ခဲ့သော ${minutesAgoMatch[1]} မိနစ်`;
  }

  const totalBusinessLoanMatch = text.match(/^(\d+) total business loan(s)?$/);
  if (totalBusinessLoanMatch) {
    return `လုပ်ငန်းချေးငွေ စုစုပေါင်း ${totalBusinessLoanMatch[1]} ခု`;
  }

  const totalRedemptionMatch = text.match(/^(\d+) total redemption(s)?$/);
  if (totalRedemptionMatch) {
    return `ရွေးယူမှု စုစုပေါင်း ${totalRedemptionMatch[1]} ခု`;
  }

  const totalFinancialAccountMatch = text.match(
    /^(\d+) financial account(s)?$/,
  );
  if (totalFinancialAccountMatch) {
    return `ငွေစာရင်းအကောင့် ${totalFinancialAccountMatch[1]} ခု`;
  }

  const totalLedgerMatch = text.match(/^(\d+) ledger (entry|entries)$/);
  if (totalLedgerMatch) {
    return `စာရင်းမှတ်တမ်း ${totalLedgerMatch[1]} ခု`;
  }

  const staffAccountAccessMatch = text.match(
    /^(\d+) staff member(s)? can use this account\.$/,
  );
  if (staffAccountAccessMatch) {
    return `ဤအကောင့်ကို ဝန်ထမ်း ${staffAccountAccessMatch[1]} ဦး အသုံးပြုနိုင်သည်။`;
  }

  const customerSinceMatch = text.match(/^Customer since (.+)$/);
  if (customerSinceMatch) {
    return `${customerSinceMatch[1]} မှစ၍ ဖောက်သည်ဖြစ်သည်`;
  }

  const activeSlipsMatch = text.match(/^(\d+) active slips$/);
  if (activeSlipsMatch) {
    return `လက်ရှိစာချုပ် ${activeSlipsMatch[1]} ခု`;
  }

  const averageLoanTermMatch = text.match(/^(\d+) Days$/);
  if (averageLoanTermMatch) {
    return `${averageLoanTermMatch[1]} ရက်`;
  }

  const dashboardLoansMatch = text.match(/^(\d+) loans$/);
  if (dashboardLoansMatch) {
    return `ချေးငွေ ${dashboardLoansMatch[1]} ခု`;
  }

  const defaultOutstandingMatch = text.match(/^(.+) outstanding$/);
  if (defaultOutstandingMatch) {
    return `${defaultOutstandingMatch[1]} ကျန်ရှိငွေ`;
  }

  const currencyPerKyatMatch = text.match(/^(.+) per kyat$/);
  if (currencyPerKyatMatch) {
    return `တစ်ကျပ်သားလျှင် ${currencyPerKyatMatch[1]}`;
  }

  const ratePairMatch = text.match(/^(.+) to (.+)$/);
  if (ratePairMatch) {
    return `${ratePairMatch[1]} မှ ${ratePairMatch[2]} သို့`;
  }

  const accountingClosedMatch = text.match(
    /^Accounting day (.+) was closed successfully\.$/,
  );
  if (accountingClosedMatch) {
    return `${accountingClosedMatch[1]} စာရင်းကိုင်ရက် ပိတ်ပြီးပါပြီ။`;
  }

  const closeAccountingDayMatch = text.match(
    /^Close accounting day (.+)\? Financial amounts for this day will become immutable\.$/,
  );
  if (closeAccountingDayMatch) {
    return `${closeAccountingDayMatch[1]} စာရင်းကိုင်ရက်ကို ပိတ်မည်လား။ ဤနေ့အတွက် ငွေပမာဏများကို ပြောင်းလဲ၍ မရတော့ပါ။`;
  }

  const capitalSavedMatch = text.match(
    /^Capital (created|updated) successfully\.$/,
  );
  if (capitalSavedMatch) {
    return capitalSavedMatch[1] === "created"
      ? "အရင်းအနှီး ဖန်တီးပြီးပါပြီ။"
      : "အရင်းအနှီး အပ်ဒိတ်လုပ်ပြီးပါပြီ။";
  }

  const currencySavedMatch = text.match(/^Currency (updated|created)\.$/);
  if (currencySavedMatch) {
    return currencySavedMatch[1] === "created"
      ? "ငွေကြေး ဖန်တီးပြီးပါပြီ။"
      : "ငွေကြေး အပ်ဒိတ်လုပ်ပြီးပါပြီ။";
  }

  const setCurrencyInactiveMatch = text.match(
    /^Set (.+) inactive\? Historical references will be preserved\.$/,
  );
  if (setCurrencyInactiveMatch) {
    return `${setCurrencyInactiveMatch[1]} ကို အသုံးမပြုတော့ရန် သတ်မှတ်မည်လား။ သမိုင်းဝင်ရည်ညွှန်းချက်များကို ထိန်းသိမ်းထားပါမည်။`;
  }

  const setItemInactiveMatch = text.match(/^Set (.+) inactive$/);
  if (setItemInactiveMatch) {
    return `${setItemInactiveMatch[1]} ကို အသုံးမပြုတော့ရန်`;
  }

  const deleteBusinessLoanMatch = text.match(
    /^Delete business loan (.+)\? This action cannot be undone\.$/,
  );
  if (deleteBusinessLoanMatch) {
    return `လုပ်ငန်းချေးငွေ ${deleteBusinessLoanMatch[1]} ကို ဖျက်မည်လား။ ဤလုပ်ဆောင်ချက်ကို ပြန်ပြင်၍ မရပါ။`;
  }

  const returnReportingCurrencyMatch = text.match(
    /^Return reporting currency to (.+)\? Historical rates already submitted will be retained\.$/,
  );
  if (returnReportingCurrencyMatch) {
    return `အစီရင်ခံငွေကြေးကို ${returnReportingCurrencyMatch[1]} သို့ ပြန်ထားမည်လား။ တင်သွင်းပြီးသော သမိုင်းဝင်နှုန်းထားများကို ဆက်လက်ထိန်းသိမ်းပါမည်။`;
  }

  const recordPaymentForMatch = text.match(/^Record payment for (.+)$/);
  if (recordPaymentForMatch) {
    return `${recordPaymentForMatch[1]} အတွက် ပေးချေမှု မှတ်တမ်းတင်ရန်`;
  }

  const viewItemMatch = text.match(/^View (.+)$/);
  if (viewItemMatch) {
    return `${viewItemMatch[1]} ကြည့်ရန်`;
  }

  const slipNumberMatch = text.match(/^Slip (.+)$/);
  if (slipNumberMatch) {
    return `စာချုပ် ${slipNumberMatch[1]}`;
  }

  const compoundedInterestMatch = text.match(
    /^Compounded (.+) into principal\.$/,
  );
  if (compoundedInterestMatch) {
    return `${compoundedInterestMatch[1]} ကို မူရင်းထဲသို့ ပေါင်းထည့်ပြီးပါပြီ။`;
  }

  const redemptionCalculatedMatch = text.match(
    /^Redemption calculated for slip (.+)\.$/,
  );
  if (redemptionCalculatedMatch) {
    return `စာချုပ် ${redemptionCalculatedMatch[1]} အတွက် ရွေးယူမှု တွက်ချက်ပြီးပါပြီ။`;
  }

  return null;
}
