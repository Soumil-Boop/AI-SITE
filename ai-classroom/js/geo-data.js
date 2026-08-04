/* ============================================================
   geo-data.js — Country list + states/provinces for the address
   fields. Shared by the sign-up form and Account Settings.
   Countries with a known list render a State dropdown; any other
   country falls back to a free-text State/Province input.
   ============================================================ */
(function () {
  var GEO = {};

  // India first (primary audience), then other common study destinations, then A–Z.
  GEO.countries = [
    "India", "United States", "United Kingdom", "Canada", "Australia",
    "United Arab Emirates", "Singapore", "New Zealand", "Ireland",
    "Bangladesh", "Bhutan", "Maldives", "Nepal", "Pakistan", "Sri Lanka",
    "Bahrain", "Kuwait", "Oman", "Qatar", "Saudi Arabia",
    "Austria", "Belgium", "Brazil", "China", "Denmark", "Egypt", "France",
    "Germany", "Greece", "Hong Kong", "Indonesia", "Italy", "Japan", "Kenya",
    "Malaysia", "Mexico", "Netherlands", "Nigeria", "Norway", "Philippines",
    "Poland", "Portugal", "South Africa", "South Korea", "Spain", "Sweden",
    "Switzerland", "Thailand", "Turkey", "Vietnam",
    "Other"
  ];

  GEO.states = {
    "India": [
      "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
      "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
      "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
      "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
      "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
      "Andaman and Nicobar Islands", "Chandigarh",
      "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
      "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
    ],
    "United States": [
      "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
      "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia",
      "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
      "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
      "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
      "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota",
      "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
      "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
      "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
    ],
    "United Kingdom": ["England", "Scotland", "Wales", "Northern Ireland"],
    "Canada": [
      "Alberta", "British Columbia", "Manitoba", "New Brunswick",
      "Newfoundland and Labrador", "Nova Scotia", "Ontario",
      "Prince Edward Island", "Quebec", "Saskatchewan",
      "Northwest Territories", "Nunavut", "Yukon"
    ],
    "Australia": [
      "Australian Capital Territory", "New South Wales", "Northern Territory",
      "Queensland", "South Australia", "Tasmania", "Victoria",
      "Western Australia"
    ],
    "United Arab Emirates": [
      "Abu Dhabi", "Ajman", "Dubai", "Fujairah", "Ras Al Khaimah",
      "Sharjah", "Umm Al Quwain"
    ],
    "Nepal": [
      "Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali",
      "Sudurpashchim"
    ],
    "Pakistan": [
      "Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan",
      "Gilgit-Baltistan", "Azad Jammu and Kashmir", "Islamabad Capital Territory"
    ]
  };

  /* Cities for the busiest states. Any state without a list falls back to a
     free-text box, exactly the way an unlisted country does for State. */
  GEO.cities = {
    "Andhra Pradesh":["Guntur","Nellore","Tirupati","Vijayawada","Visakhapatnam"],
    "Assam":["Dibrugarh","Guwahati","Jorhat","Silchar"],
    "Bihar":["Bhagalpur","Darbhanga","Gaya","Muzaffarpur","Patna"],
    "Chandigarh":["Chandigarh"],
    "Chhattisgarh":["Bhilai","Bilaspur","Korba","Raipur"],
    "Delhi":["Dwarka","Najafgarh","Narela","New Delhi","Rohini"],
    "Goa":["Margao","Panaji","Vasco da Gama"],
    "Gujarat":["Ahmedabad","Bhavnagar","Gandhinagar","Jamnagar","Rajkot","Surat","Vadodara"],
    "Haryana":["Ambala","Faridabad","Gurugram","Hisar","Karnal","Panipat"],
    "Himachal Pradesh":["Dharamshala","Shimla","Solan"],
    "Jammu and Kashmir":["Jammu","Srinagar"],
    "Jharkhand":["Bokaro","Dhanbad","Jamshedpur","Ranchi"],
    "Karnataka":["Belagavi","Bengaluru","Hubballi","Mangaluru","Mysuru","Shivamogga"],
    "Kerala":["Kochi","Kollam","Kozhikode","Thiruvananthapuram","Thrissur"],
    "Madhya Pradesh":["Bhopal","Gwalior","Indore","Jabalpur","Ujjain"],
    "Maharashtra":["Aurangabad","Mumbai","Nagpur","Nashik","Navi Mumbai","Pune","Thane"],
    "Odisha":["Bhubaneswar","Cuttack","Rourkela","Sambalpur"],
    "Puducherry":["Puducherry"],
    "Punjab":["Amritsar","Bathinda","Jalandhar","Ludhiana","Patiala"],
    "Rajasthan":["Ajmer","Bikaner","Jaipur","Jodhpur","Kota","Udaipur"],
    "Tamil Nadu":["Chennai","Coimbatore","Madurai","Salem","Tiruchirappalli","Tirunelveli"],
    "Telangana":["Hyderabad","Karimnagar","Nizamabad","Warangal"],
    "Uttar Pradesh":["Agra","Ghaziabad","Kanpur","Lucknow","Meerut","Noida","Prayagraj","Varanasi"],
    "Uttarakhand":["Dehradun","Haldwani","Haridwar","Roorkee"],
    "West Bengal":["Asansol","Durgapur","Howrah","Kolkata","Siliguri"],
    "England":["Birmingham","Bristol","Leeds","Liverpool","London","Manchester","Sheffield"],
    "Scotland":["Aberdeen","Dundee","Edinburgh","Glasgow"],
    "Wales":["Cardiff","Newport","Swansea"],
    "Northern Ireland":["Belfast","Londonderry"],
    "California":["Los Angeles","Sacramento","San Diego","San Francisco","San Jose"],
    "Illinois":["Chicago","Naperville","Springfield"],
    "New York":["Albany","Buffalo","New York City","Rochester"],
    "Texas":["Austin","Dallas","Fort Worth","Houston","San Antonio"],
    "Washington":["Bellevue","Seattle","Spokane","Tacoma"],
    "Ontario":["Hamilton","Mississauga","Ottawa","Toronto"],
    "British Columbia":["Burnaby","Surrey","Vancouver","Victoria"],
    "New South Wales":["Newcastle","Sydney","Wollongong"],
    "Victoria":["Geelong","Melbourne"],
    "Dubai":["Deira","Dubai Marina","Jumeirah"],
    "Abu Dhabi":["Abu Dhabi City","Al Ain"]
  };

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  /* Fill a <select> with the country list. */
  GEO.populateCountries = function (selectId, selected) {
    var sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = GEO.countries.map(function (c) {
      return '<option value="' + esc(c) + '"' + (c === selected ? ' selected' : '') + '>' + esc(c) + '</option>';
    }).join('');
  };

  /* Render the State control inside `wrapId`: a dropdown when the country has a
     known list, otherwise a free-text input. The control always keeps id `stateId`. */
  GEO.renderState = function (wrapId, stateId, country, selected) {
    var wrap = document.getElementById(wrapId);
    if (!wrap) return;
    selected = selected || '';
    var list = GEO.states[country];
    if (list && list.length) {
      var opts = '<option value="">Select…</option>' + list.map(function (s) {
        return '<option value="' + esc(s) + '"' + (s === selected ? ' selected' : '') + '>' + esc(s) + '</option>';
      }).join('');
      wrap.innerHTML = '<select id="' + stateId + '">' + opts + '</select>';
    } else {
      wrap.innerHTML = '<input type="text" id="' + stateId + '" placeholder="State / Province" value="' + esc(selected) + '"/>';
    }
  };

  /* Render the City control inside `wrapId`: a dropdown when the state has a
     known list, otherwise a free-text input. Mirrors renderState exactly, and
     the control always keeps id `cityId` so callers read it the same way.
     Picking "Other" swaps the dropdown for a text box on the spot. */
  GEO.renderCity = function (wrapId, cityId, state, selected) {
    var wrap = document.getElementById(wrapId);
    if (!wrap) return;
    selected = selected || '';
    var list = GEO.cities[state];
    if (list && list.length) {
      var known = list.indexOf(selected) !== -1;
      var opts = '<option value="">Select…</option>' + list.map(function (c) {
        return '<option value="' + esc(c) + '"' + (c === selected ? ' selected' : '') + '>' + esc(c) + '</option>';
      }).join('') + '<option value="__other">Other — type it in</option>';
      wrap.innerHTML = '<select id="' + cityId + '" onchange="GEO.cityOther(\'' + wrapId + '\',\'' + cityId + '\',this)">' + opts + '</select>';
      if (selected && !known) GEO.renderCityInput(wrap, cityId, selected);
    } else {
      GEO.renderCityInput(wrap, cityId, selected);
    }
  };
  GEO.renderCityInput = function (wrap, cityId, selected) {
    wrap.innerHTML = '<input type="text" id="' + cityId + '" placeholder="Your city" value="' + esc(selected || '') + '"/>';
  };
  GEO.cityOther = function (wrapId, cityId, sel) {
    if (sel.value !== '__other') return;
    var wrap = document.getElementById(wrapId);
    if (!wrap) return;
    GEO.renderCityInput(wrap, cityId, '');
    var el = document.getElementById(cityId);
    if (el) el.focus();
  };

  window.GEO = GEO;
})();
