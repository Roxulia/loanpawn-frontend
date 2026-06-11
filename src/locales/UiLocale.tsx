import type { ReactNode } from 'react'
import { useTenantSession } from '../contexts/useTenantSession'
import type { ModuleDefinition } from '../modules/moduleRegistry'

export type UiLocale = 'en' | 'mm'

export const uiLocaleOptions: Array<{ label: string; locale: UiLocale; nativeLabel: string }> = [
  { label: 'English', locale: 'en', nativeLabel: 'English' },
  { label: 'Myanmar', locale: 'mm', nativeLabel: 'မြန်မာ' },
]

type TranslateParams = Record<string, string | number>

const mmTranslations: Record<string, string> = {
  Accounting: 'စာရင်းကိုင်',
  Actions: 'လုပ်ဆောင်ချက်များ',
  Address: 'လိပ်စာ',
  Administration: 'စီမံခန့်ခွဲရေး',
  Amount: 'ပမာဏ',
  'Amount must be greater than zero.': 'ပမာဏသည် သုညထက်ကြီးရမည်။',
  Back: 'နောက်သို့',
  Balance: 'လက်ကျန်',
  'Branding Setting': 'အမှတ်တံဆိပ် ဆက်တင်',
  'Built-in': 'မူလပါရှိသည်',
  Cancel: 'မလုပ်တော့ပါ',
  Change: 'ပြန်အမ်းငွေ',
  'Change Password': 'စကားဝှက် ပြောင်းရန်',
  City: 'မြို့',
  Citizen: 'နိုင်ငံသားအမျိုးအစား',
  Close: 'ပိတ်ရန်',
  Code: 'ကုဒ်',
  Collateral: 'အပေါင်ပစ္စည်း',
  Confirm: 'အတည်ပြုရန်',
  'Complete NRC or leave it empty.': 'နိုင်ငံသားစိစစ်ရေးအမှတ်ကို အပြည့်အစုံဖြည့်ပါ သို့မဟုတ် လွတ်ထားပါ။',
  Country: 'နိုင်ငံ',
  Created: 'ဖန်တီးသည့်ရက်',
  Credit: 'အဝင်',
  Custom: 'စိတ်ကြိုက်',
  Customers: 'ဖောက်သည်များ',
  Dashboard: 'ဒက်ရှ်ဘုတ်',
  Date: 'ရက်စွဲ',
  Debt: 'အကြွေး',
  Debts: 'အကြွေးများ',
  Delete: 'ဖျက်ရန်',
  'Delete Debt': 'အကြွေး ဖျက်ရန်',
  'Delete Expense': 'အသုံးစရိတ် ဖျက်ရန်',
  Description: 'ဖော်ပြချက်',
  Dismiss: 'ဖျောက်ရန်',
  'Dismiss notification': 'အသိပေးချက် ဖျောက်ရန်',
  Done: 'ပြီးပြီ',
  Download: 'ဒေါင်းလုဒ်',
  'Download Excel': 'Excel ဒေါင်းလုဒ်',
  Duration: 'ကြာချိန်',
  'Duration In Days': 'ကြာချိန် (ရက်)',
  Edit: 'ပြင်ရန်',
  Email: 'အီးမေးလ်',
  English: 'English',
  Expenses: 'အသုံးစရိတ်များ',
  Finance: 'ဘဏ္ဍာရေး',
  'Final': 'နောက်ဆုံး',
  'General ledger': 'အထွေထွေစာရင်း',
  'Generate Ledger': 'စာရင်းထုတ်ရန်',
  Guest: 'ဧည့်သည်',
  Interest: 'အတိုး',
  'Interest Payments': 'အတိုးပေးချေမှုများ',
  'Interest Types': 'အတိုးအမျိုးအစားများ',
  Language: 'ဘာသာစကား',
  Loading: 'ဖွင့်နေသည်',
  Logout: 'ထွက်ရန်',
  Myanmar: 'မြန်မာ',
  Name: 'အမည်',
  'NRC is required.': 'နိုင်ငံသားစိစစ်ရေးအမှတ် ဖြည့်ရန်လိုအပ်ပါသည်။',
  Next: 'ရှေ့သို့',
  'No data': 'ဒေတာမရှိပါ',
  'No records found.': 'မှတ်တမ်း မတွေ့ပါ။',
  Opening: 'အစလက်ကျန်',
  Operations: 'လုပ်ငန်းများ',
  Outgoing: 'အထွက်',
  Page: 'စာမျက်နှာ',
  Paid: 'ပေးချေပြီး',
  Password: 'စကားဝှက်',
  Phone: 'ဖုန်း',
  Previous: 'နောက်သို့',
  'Profile Setting': 'ပရိုဖိုင် ဆက်တင်',
  Reference: 'ရည်ညွှန်းချက်',
  Refresh: 'ပြန်ဖွင့်ရန်',
  Redemptions: 'ရွေးယူမှုများ',
  Save: 'သိမ်းရန်',
  'Save Changes': 'ပြောင်းလဲမှုများ သိမ်းရန်',
  Search: 'ရှာရန်',
  Settings: 'ဆက်တင်များ',
  Slip: 'စာချုပ်',
  'Loan Slips': 'ချေးငွေစာချုပ်များ',
  Staff: 'ဝန်ထမ်းများ',
  Status: 'အခြေအနေ',
  State: 'တိုင်း/ပြည်နယ်',
  Tag: 'တက်ဂ်',
  'Tenant Contact Setting': 'ဆိုင် ဆက်သွယ်ရန် ဆက်တင်',
  'Tenant Setting': 'ဆိုင် ဆက်တင်',
  'Tenant session': 'ဆိုင်အသုံးပြုမှု',
  'Tenant workspace': 'ဆိုင်လုပ်ငန်းခွင်',
  Time: 'အချိန်',
  'Total': 'စုစုပေါင်း',
  Trust: 'ယုံကြည်မှု',
  'Type Data Setting': 'အမျိုးအစား ဒေတာ ဆက်တင်',
  Type: 'အမျိုးအစား',
  Township: 'မြို့နယ်',
  Unpaid: 'မပေးချေရသေး',
  User: 'အသုံးပြုသူ',
  Workspace: 'လုပ်ငန်းခွင်',
  'Pawn Operations': 'အပေါင်လုပ်ငန်းများ',
  'Active workspaces': 'အသုံးပြုနေသော လုပ်ငန်းခွင်များ',
  'Server routes mapped': 'ဆာဗာလမ်းကြောင်းများ ချိတ်ဆက်ပြီး',
  'Pawn operations': 'အပေါင်လုပ်ငန်းများ',
  'Slip lifecycle ready': 'စာချုပ် လုပ်ငန်းစဉ် အသင့်',
  'Tenant operations': 'ဆိုင်လုပ်ငန်းများ',
  'Staff and finance ready': 'ဝန်ထမ်းနှင့် ဘဏ္ဍာရေး အသင့်',
  'Please confirm this action': 'ဤလုပ်ဆောင်ချက်ကို အတည်ပြုပါ',
  'Checking session': 'အသုံးပြုမှု စစ်ဆေးနေသည်',
  'Please wait': 'ခဏစောင့်ပါ',
  'Open navigation': 'လမ်းညွှန်မီနူး ဖွင့်ရန်',
  'Close modal': 'မော်ဒယ် ပိတ်ရန်',
  'Application sections': 'အက်ပ် ကဏ္ဍများ',
  'Main navigation': 'အဓိက လမ်းညွှန်',
  'Select UI language': 'UI ဘာသာစကား ရွေးရန်',
  'User interface language': 'အသုံးပြုသူ မျက်နှာပြင် ဘာသာစကား',
  'Choose the language used for this browser session.': 'ဤအသုံးပြုမှုအတွက် ဘာသာစကားကို ရွေးပါ။',
  'Accounting effect': 'စာရင်းကိုင် သက်ရောက်မှု',
  'Add Jewellery Item': 'ရွှေထည်ပစ္စည်း ထည့်ရန်',
  'Add Normal Item': 'ပုံမှန်ပစ္စည်း ထည့်ရန်',
  'Back to Settings': 'ဆက်တင်များသို့ ပြန်သွားရန်',
  'Calculated from item value, quantity, and jewellery weight where applicable.': 'ပစ္စည်းတန်ဖိုး၊ အရေအတွက်နှင့် လိုအပ်ပါက ရွှေထည်အလေးချိန်အပေါ် အခြေခံတွက်ချက်သည်။',
  Center: 'အလယ်',
  'Choose an item type to start adding collateral.': 'အပေါင်ပစ္စည်း စထည့်ရန် ပစ္စည်းအမျိုးအစား ရွေးပါ။',
  'Clear': 'ရှင်းရန်',
  'Collateral Summary': 'အပေါင်ပစ္စည်း အကျဉ်းချုပ်',
  'Create New Template': 'Template အသစ် ဖန်တီးရန်',
  'Create Slip': 'စာချုပ် ဖန်တီးရန်',
  'Create debt if payment is insufficient': 'ပေးချေငွေ မလုံလောက်ပါက အကြွေး ဖန်တီးရန်',
  'Day': 'ရက်',
  'Debt Snapshot': 'အကြွေး အကျဉ်းချုပ်',
  'Expense records create outgoing accounting entries server-side.': 'အသုံးစရိတ်မှတ်တမ်းများသည် ဆာဗာတွင် အထွက်စာရင်းများ ဖန်တီးသည်။',
  'Footer Editor': 'Footer Editor',
  'Have Gem Stone': 'ကျောက်ပါသည်',
  'Header Editor': 'Header Editor',
  'History': 'မှတ်တမ်း',
  'Interest Snapshot': 'အတိုး အကျဉ်းချုပ်',
  'Interest payment sections': 'အတိုးပေးချေမှု ကဏ္ဍများ',
  'Left': 'ဘယ်',
  'Load Detail': 'အသေးစိတ် ဖွင့်ရန်',
  'Load Slip': 'စာချုပ် ဖွင့်ရန်',
  'Loan Application': 'ချေးငွေလျှောက်လွှာ',
  'Loan slip sections': 'ချေးငွေစာချုပ် ကဏ္ဍများ',
  'Management': 'စီမံခန့်ခွဲမှု',
  'Minimum Retail Price': 'အနည်းဆုံး လက်လီစျေး',
  'Month': 'လ',
  'No collateral items returned.': 'အပေါင်ပစ္စည်းများ မရရှိပါ။',
  'No interest rows returned.': 'အတိုးစာကြောင်းများ မရရှိပါ။',
  'No redemption selected.': 'ရွေးယူမှု မရွေးထားပါ။',
  'No unpaid debts returned.': 'မပေးချေရသေးသော အကြွေးများ မရရှိပါ။',
  'Preview': 'ကြည့်ရှုရန်',
  'Print after saving': 'သိမ်းပြီးပါက ပရင့်ထုတ်ရန်',
  'Record Payment': 'ပေးချေမှု မှတ်တမ်းတင်ရန်',
  'Redeem': 'ရွေးယူရန်',
  'Remove': 'ဖယ်ရှားရန်',
  'Remove Component': 'Component ဖယ်ရှားရန်',
  'Reset': 'ပြန်စရန်',
  'Right': 'ညာ',
  'Select a component on the canvas to update its coordinates and sizing.': 'တည်နေရာနှင့် အရွယ်အစား ပြင်ရန် canvas ပေါ်မှ component တစ်ခုကို ရွေးပါ။',
  'Select interest type': 'အတိုးအမျိုးအစား ရွေးပါ',
  'Select material': 'ပစ္စည်းအမျိုးအစား ရွေးပါ',
  'Template Editor': 'Template Editor',
  'View': 'ကြည့်ရန်',
  'Week': 'ပတ်',
  'Workflow': 'လုပ်ငန်းစဉ်',
  'Year': 'နှစ်',
  'Accrual Breakdown': 'အတိုးတွက်ချက်မှု အသေးစိတ်',
  'Add Customer': 'ဖောက်သည် ထည့်ရန်',
  'Add Debt': 'အကြွေး ထည့်ရန်',
  'Add Expense': 'အသုံးစရိတ် ထည့်ရန်',
  'Add Staff': 'ဝန်ထမ်း ထည့်ရန်',
  'All Slips': 'စာချုပ်အားလုံး',
  'Brand': 'အမှတ်တံဆိပ်',
  'Collateral Details': 'အပေါင်ပစ္စည်း အသေးစိတ်',
  'Collateral Items': 'အပေါင်ပစ္စည်းများ',
  'Collateral required': 'အပေါင်ပစ္စည်း လိုအပ်သည်',
  'Completed interest payments will appear here.': 'ပြီးဆုံးသော အတိုးပေးချေမှုများ ဤနေရာတွင် ပြမည်။',
  'Completed redemptions will appear here.': 'ပြီးဆုံးသော ရွေးယူမှုများ ဤနေရာတွင် ပြမည်။',
  'Confirm debt recording': 'အကြွေးမှတ်တမ်းတင်မှု အတည်ပြုရန်',
  'Confirm type deletion': 'အမျိုးအစားဖျက်မှု အတည်ပြုရန်',
  'Current Date': 'လက်ရှိရက်စွဲ',
  'Customer': 'ဖောက်သည်',
  'Customer Details': 'ဖောက်သည် အသေးစိတ်',
  'Customer records': 'ဖောက်သည်မှတ်တမ်းများ',
  'Debt Amount': 'အကြွေးပမာဏ',
  'Debt Payment Result': 'အကြွေးပေးချေမှု ရလဒ်',
  'Debt payment failed': 'အကြွေးပေးချေမှု မအောင်မြင်ပါ',
  'Default Password': 'မူလစကားဝှက်',
  'End Date': 'ပြီးဆုံးရက်',
  'Estimated Value': 'ခန့်မှန်းတန်ဖိုး',
  'Expense type': 'အသုံးစရိတ်အမျိုးအစား',
  'Expire Date': 'သက်တမ်းကုန်ရက်',
  'Expiry Quota': 'သက်တမ်းပမာဏ',
  'Expiry Unit': 'သက်တမ်းယူနစ်',
  'Filter Debts': 'အကြွေးများ စစ်ရန်',
  'Filter Expenses': 'အသုံးစရိတ်များ စစ်ရန်',
  'Gross Amount': 'စုစုပေါင်းပမာဏ',
  'Incoming Transactions Today': 'ယနေ့ အဝင်စာရင်းများ',
  'Insufficient payment': 'ပေးချေငွေ မလုံလောက်ပါ',
  'Interest Amount': 'အတိုးပမာဏ',
  'Interest History': 'အတိုးမှတ်တမ်း',
  'Interest Payment Result': 'အတိုးပေးချေမှု ရလဒ်',
  'Interest Rate': 'အတိုးနှုန်း',
  'Interest Type': 'အတိုးအမျိုးအစား',
  'Item Name': 'ပစ္စည်းအမည်',
  'Jewellery': 'ရွှေထည်',
  'Kyat': 'ကျပ်သား',
  'Loan Amount': 'ချေးငွေပမာဏ',
  'Loan Details': 'ချေးငွေ အသေးစိတ်',
  'Loan Notes': 'ချေးငွေ မှတ်ချက်',
  'Loan slip action failed': 'ချေးငွေစာချုပ် လုပ်ဆောင်မှု မအောင်မြင်ပါ',
  'Loan slip lookup failed': 'ချေးငွေစာချုပ် ရှာဖွေမှု မအောင်မြင်ပါ',
  'Loan slip updated': 'ချေးငွေစာချုပ် ပြင်ဆင်ပြီး',
  'Material': 'ပစ္စည်းအမျိုးအစား',
  'Material Price per Kyat': 'တစ်ကျပ်သား စျေးနှုန်း',
  'Material Type': 'ပစ္စည်းအမျိုးအစား',
  'Net Amount': 'အသားတင်ပမာဏ',
  'No calculation yet': 'တွက်ချက်မှု မရှိသေးပါ',
  'No interest due': 'ပေးရန်အတိုး မရှိပါ',
  'No interest payments yet': 'အတိုးပေးချေမှု မရှိသေးပါ',
  'No ledger generated': 'စာရင်း မထုတ်ရသေးပါ',
  'No redemptions yet': 'ရွေးယူမှု မရှိသေးပါ',
  'No slip': 'စာချုပ် မရှိပါ',
  'No slips yet': 'စာချုပ် မရှိသေးပါ',
  'Normal': 'ပုံမှန်',
  'Note': 'မှတ်ချက်',
  'Notes': 'မှတ်ချက်များ',
  'Outgoing Transactions Today': 'ယနေ့ အထွက်စာရင်းများ',
  'Paid Amount': 'ပေးချေငွေ',
  'Pal': 'ပဲ',
  'Payment Amount': 'ပေးချေငွေ',
  'Payment Date': 'ပေးချေရက်',
  'Payment is insufficient. Submit this payment and create debt for the remaining interest?': 'ပေးချေငွေ မလုံလောက်ပါ။ ဤပေးချေမှုကို တင်ပြီး ကျန်အတိုးအတွက် အကြွေးဖန်တီးမည်လား။',
  'Payment is less than calculated interest. Confirm debt recording before submitting.': 'ပေးချေငွေသည် တွက်ချက်ထားသော အတိုးထက်နည်းနေသည်။ မတင်မီ အကြွေးမှတ်တမ်းတင်မှုကို အတည်ပြုပါ။',
  'Period': 'ကာလ',
  'Print slip': 'စာချုပ် ပရင့်ထုတ်ရန်',
  'Quantity': 'အရေအတွက်',
  'Receive Payment': 'ပေးချေငွေ လက်ခံရန်',
  'Received': 'လက်ခံငွေ',
  'Record Debt': 'အကြွေး မှတ်တမ်းတင်ရန်',
  'Redemption Date': 'ရွေးယူရက်',
  'Redemption Detail': 'ရွေးယူမှု အသေးစိတ်',
  'Redemption History': 'ရွေးယူမှု မှတ်တမ်း',
  'Redemption Result': 'ရွေးယူမှု ရလဒ်',
  'Redemption action failed': 'ရွေးယူမှု လုပ်ဆောင်ချက် မအောင်မြင်ပါ',
  'Redemption sections': 'ရွေးယူမှု ကဏ္ဍများ',
  'Redemption updated': 'ရွေးယူမှု ပြင်ဆင်ပြီး',
  'Redeemed At': 'ရွေးယူသည့်အချိန်',
  'Search customers': 'ဖောက်သည်များ ရှာရန်',
  'Search slips': 'စာချုပ်များ ရှာရန်',
  'Select a redemption record': 'ရွေးယူမှုမှတ်တမ်း ရွေးပါ',
  'Slip Detail': 'စာချုပ် အသေးစိတ်',
  'Slip Lookup': 'စာချုပ် ရှာဖွေခြင်း',
  'Slip No': 'စာချုပ်နံပါတ်',
  'Slip Number or Barcode': 'စာချုပ်နံပါတ် သို့မဟုတ် ဘားကုဒ်',
  'Start Date': 'စတင်ရက်',
  'Suggested minimum retail total': 'အကြံပြု အနည်းဆုံး လက်လီစုစုပေါင်း',
  'Total Amount To Pay': 'ပေးချေရမည့် စုစုပေါင်းပမာဏ',
  'Total Interest': 'စုစုပေါင်း အတိုး',
  'Weight': 'အလေးချိန်',
  'Yway': 'ရွေး',
}

const moduleTranslations: Record<string, { description: string; label: string }> = {
  accounting: {
    description: 'ဘဏ္ဍာရေးလုပ်ဆောင်ချက်များမှ ဖန်တီးထားသော ဝင်ငွေနှင့် အသုံးစရိတ် စာရင်းများ။',
    label: 'စာရင်းကိုင်',
  },
  collateral: {
    description: 'ရွှေထည်နှင့် ပုံမှန် အပေါင်ပစ္စည်းများကို ရှာဖွေပြီး အခြေအနေ စစ်ဆေးရန်။',
    label: 'အပေါင်ပစ္စည်း',
  },
  customers: {
    description: 'ဖောက်သည်ရှာဖွေမှု၊ ကိုယ်ရေးအချက်အလက်နှင့် ဖျက်သိမ်းမှု လုပ်ငန်းစဉ်။',
    label: 'ဖောက်သည်များ',
  },
  debts: {
    description: 'မပေးချေရသေးသော အတိုးနှင့် အခြားအကြွေး မှတ်တမ်းများ။',
    label: 'အကြွေးများ',
  },
  expenses: {
    description: 'စာရင်းကိုင်မှတ်တမ်းနှင့် ချိတ်ဆက်သော ဆိုင်အသုံးစရိတ် မှတ်တမ်းများ။',
    label: 'အသုံးစရိတ်များ',
  },
  interest: {
    description: 'အတိုးတွက်ချက်မှု၊ ပေးချေမှုတင်ခြင်းနှင့် မပေးချေရသေးသော အကြွေးစီမံခြင်း။',
    label: 'အတိုးပေးချေမှုများ',
  },
  redemptions: {
    description: 'ရွေးယူငွေတွက်ချက်မှု၊ အပေါင်ပစ္စည်း ပြန်လွှတ်မှုနှင့် ရွေးယူမှုမှတ်တမ်းများ။',
    label: 'ရွေးယူမှုများ',
  },
  settings: {
    description: 'ဆိုင်ဆက်တင်၊ အမှတ်တံဆိပ်နှင့် စာချုပ်စာရွက် ဒီဇိုင်းထိန်းချုပ်မှုများ။',
    label: 'ဆက်တင်များ',
  },
  slips: {
    description: 'အပေါင်စာချုပ် ဖန်တီးမှု၊ ရှာဖွေမှု၊ စာရွက် preview နှင့် မှတ်တမ်း။',
    label: 'ချေးငွေစာချုပ်များ',
  },
  staff: {
    description: 'ဆိုင်ဝန်ထမ်းအကောင့်များ၊ ရာထူးများနှင့် ခွင့်ပြုချက်များ။',
    label: 'ဝန်ထမ်းများ',
  },
}

export function useUiLocale() {
  const { locale, setLocale } = useTenantSession()

  return {
    locale,
    setLocale,
    t: (text: string, params?: TranslateParams) => translateUiText(locale, text, params),
  }
}

export function translateUiText(locale: UiLocale, text: string, params?: TranslateParams): string {
  const resolvedText = params ? interpolate(text, params) : text

  if (locale === 'en') {
    return resolvedText
  }

  return mmTranslations[resolvedText] ?? translateDynamicMm(resolvedText) ?? resolvedText
}

export function translateNode(node: ReactNode, locale: UiLocale): ReactNode {
  return typeof node === 'string' ? translateUiText(locale, node) : node
}

export function getLocalizedModule(module: ModuleDefinition, locale: UiLocale) {
  if (locale === 'en') {
    return module
  }

  const localized = moduleTranslations[module.id]

  return localized ? { ...module, ...localized } : module
}

export function LocaleSwitcher({ id = 'ui-locale' }: { id?: string }) {
  const { locale, setLocale, t } = useUiLocale()

  return (
    <div className="locale-switcher" role="group" aria-label={t('Select UI language')}>
      {uiLocaleOptions.map((option) => (
        <button
          aria-pressed={locale === option.locale}
          className={locale === option.locale ? 'is-active' : undefined}
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
  )
}

export function LocalizedText({ text }: { text: string }) {
  const { t } = useUiLocale()

  return <>{t(text)}</>
}

function interpolate(text: string, params: TranslateParams) {
  return Object.entries(params).reduce(
    (current, [key, value]) => current.replaceAll(`{${key}}`, String(value)),
    text,
  )
}

function translateDynamicMm(text: string): string | null {
  const pageMatch = text.match(/^Page (\d+) of (\d+)(?: - (\d+) records)?$/)
  if (pageMatch) {
    return pageMatch[3]
      ? `စာမျက်နှာ ${pageMatch[1]} / ${pageMatch[2]} - မှတ်တမ်း ${pageMatch[3]} ခု`
      : `စာမျက်နှာ ${pageMatch[1]} / ${pageMatch[2]}`
  }

  const totalMatch = text.match(/^(\d+) total ([A-Za-z ]+?)(s)?$/)
  if (totalMatch) {
    return `စုစုပေါင်း ${translateUiText('mm', totalMatch[2])} ${totalMatch[1]} ခု`
  }

  const deleteMatch = text.match(/^Delete (.+)\? This action cannot be undone\.$/)
  if (deleteMatch) {
    return `${deleteMatch[1]} ကို ဖျက်မည်လား။ ဤလုပ်ဆောင်ချက်ကို ပြန်ပြင်၍မရပါ။`
  }

  const editMatch = text.match(/^Edit (.+)$/)
  if (editMatch) {
    return `${editMatch[1]} ပြင်ရန်`
  }

  const workspaceMatch = text.match(/^(.+) workspace$/)
  if (workspaceMatch) {
    return `${workspaceMatch[1]} လုပ်ငန်းခွင်`
  }

  const suggestedRetailMatch = text.match(/^Suggested minimum retail total: (.+)$/)
  if (suggestedRetailMatch) {
    return `အကြံပြု အနည်းဆုံး လက်လီစုစုပေါင်း: ${suggestedRetailMatch[1]}`
  }

  return null
}
