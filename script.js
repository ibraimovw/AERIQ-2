// AERIQ 3.0 — weather, locations and interface
const API="https://api.open-meteo.com/v1/forecast";
const GEO="https://geocoding-api.open-meteo.com/v1/search";
const AIR="https://air-quality-api.open-meteo.com/v1/air-quality";
const $=s=>document.querySelector(s);
const state={
  city:{name:"Бишкек",nameRu:"Бишкек",nameEn:"Bishkek",country:"Кыргызстан",countryRu:"Кыргызстан",countryEn:"Kyrgyzstan",latitude:42.8746,longitude:74.5698,timezone:"Asia/Bishkek"},
  lang:"ru",unit:"celsius",weather:null,air:null,chart:null,hourChart:null,monthChart:null,hourMode:"overview",hourView:"list",
  favorites:JSON.parse(localStorage.getItem("aeriq-favorites")||"[]"),
  history:JSON.parse(localStorage.getItem("aeriq-history")||"[]"),map:null,radarLayer:null,photoRequest:0
};
const words={
ru:{
navWeather:"Погода",navMonthly:"16 дней",navMap:"Карта",navAir:"Качество воздуха",navCities:"Мои города",sidebarLine:"Мир меняется.<br>Будь на шаг впереди.",
liveWeather:"ПОГОДА СЕЙЧАС",saveCity:"Сохранить город",feelsLike:"Ощущается как",panoramaCaption:"АТМОСФЕРА ГОРОДА В РЕАЛЬНОМ ВРЕМЕНИ",
humidity:"Влажность",relativeHumidity:"Относительная",wind:"Ветер",pressure:"Давление",seaLevel:"На уровне моря",visibility:"Видимость",clearDistance:"Дальность обзора",dewPoint:"Точка росы",comfortIndicator:"Показатель комфорта",sunrise:"Рассвет",sunset:"Закат",dayLength:"Световой день",goldenHour:"Золотой час",
forecast24:"БЛИЖАЙШИЕ 24 ЧАСА",hourlyForecast:"Почасовой прогноз",list:"Список",chart:"График",overview:"Обзор",cloudCover:"Облачность",nextSeven:"СЛЕДУЮЩИЕ 7 ДНЕЙ",sevenDay:"Прогноз на неделю",allForecast:"Весь прогноз ↗",dailyInsight:"AERIQ INSIGHT",comfort:"Комфорт сегодня",whatToWear:"ЧТО НАДЕТЬ",weatherDetailsKicker:"УСЛОВИЯ И ДЕТАЛИ",weatherDetails:"Погодные показатели",
precipitationToday:"Осадки за день",precipitationSum:"Суммарно",apparentTemp:"Ощущаемая температура",bodyPerception:"По ощущениям",maxUv:"Максимальный UV",
longRange:"ДОЛГОСРОЧНЫЙ ПРОГНОЗ",monthlyTitle:"Прогноз на 16 дней",monthlyDescription:"Подробный ежедневный прогноз на ближайшие 16 дней.",monthlyDisclaimer:"Open-Meteo предоставляет ежедневный прогноз максимум на 16 дней. Все даты в этом разделе основаны на прогнозных данных API.",temperatureTrend:"ТЕМПЕРАТУРНЫЙ ТРЕНД",monthTemperature:"Температурный тренд",
weatherMap:"Погодная карта",mapDescription:"Интерактивная карта с текущим местоположением города.",mapNote:"Базовая карта OpenStreetMap DE без пользовательского API-ключа. Для использования нужен доступ к интернету.",
airTitle:"Качество воздуха",airDescription:"Показатели загрязнения воздуха для выбранного города.",citiesTitle:"Избранные города",citiesDescription:"Сохраняй места и сравнивай погоду.",savedCities:"Сохранённые",compare:"Сравнить города",recentSearches:"Недавно просмотренные",clearHistory:"Очистить историю",footerLine:"Погода — больше, чем прогноз.",footerDescription:"Погода, которая помогает чувствовать ритм города и планировать каждый день.",footerExplore:"Навигация",footerTools:"Инструменты",footerSources:"Источники данных",footerForecast:"Прогноз на 16 дней",footerRadar:"Погодный радар",weatherInsightKicker:"ПОГОДНАЯ СВОДКА",
clear:"Ясно",mainlyClear:"Преимущественно ясно",partlyCloudy:"Переменная облачность",overcast:"Пасмурно",fog:"Туман",drizzle:"Морось",rain:"Дождь",snow:"Снег",showers:"Ливни",thunder:"Гроза",unknown:"Переменная облачность",
uvLow:"Низкий",uvModerate:"Умеренный",uvHigh:"Высокий",uvVeryHigh:"Очень высокий",uvExtreme:"Экстремальный",comfortable:"Комфортно",moderateComfort:"Умеренно",uncomfortable:"Некомфортно",wearWarm:"Надень тёплую куртку и закрытую обувь.",wearLight:"Подойдёт лёгкая одежда. Не забудь воду.",wearLayer:"Лучше одеться слоями — погода может меняться.",wearRain:"Возьми зонт или водонепроницаемую куртку.",wearWind:"Добавь ветровку: на улице ветрено.",
goodAir:"Хорошее",moderateAir:"Умеренное",sensitiveAir:"Нездоровое для чувствительных групп",badAir:"Нездоровое",veryBadAir:"Очень нездоровое",hazardAir:"Опасное",
noResults:"Город не найден",searchError:"Ошибка поиска города",weatherError:"Не удалось загрузить погоду.",locationDenied:"Не удалось определить местоположение",citySaved:"Город добавлен в избранное",cityRemoved:"Город удалён из избранного",historyEmpty:"История пока пуста",favoritesEmpty:"Пока нет сохранённых городов",compareHint:"Добавь минимум два города в избранное для сравнения.",historyCleared:"История очищена",loading:"Загружаем данные…",today:"Сегодня",now:"Сейчас",longRangeLabel:"Климатический ориентир",notForecast:"Не точный прогноз",day:"дн.",hour:"ч",updated:"Обновлено",dayWord:"день",nightWord:"ночь",airUnavailable:"Данные о качестве воздуха временно недоступны."
},
en:{
navWeather:"Weather",navMonthly:"16 days",navMap:"Map",navAir:"Air Quality",navCities:"My cities",sidebarLine:"The world changes.<br>Stay one step ahead.",
liveWeather:"CURRENT WEATHER",saveCity:"Save city",feelsLike:"Feels like",panoramaCaption:"CITY ATMOSPHERE IN REAL TIME",
humidity:"Humidity",relativeHumidity:"Relative",wind:"Wind",pressure:"Pressure",seaLevel:"Sea level",visibility:"Visibility",clearDistance:"Viewing distance",dewPoint:"Dew point",comfortIndicator:"Comfort indicator",sunrise:"Sunrise",sunset:"Sunset",dayLength:"Daylight",goldenHour:"Golden hour",
forecast24:"NEXT 24 HOURS",hourlyForecast:"Hourly forecast",list:"List",chart:"Chart",overview:"Overview",cloudCover:"Cloud cover",nextSeven:"NEXT 7 DAYS",sevenDay:"7-day forecast",allForecast:"Full forecast ↗",dailyInsight:"AERIQ INSIGHT",comfort:"Today's comfort",whatToWear:"WHAT TO WEAR",weatherDetailsKicker:"CONDITIONS & DETAILS",weatherDetails:"Weather details",
precipitationToday:"Daily precipitation",precipitationSum:"Total",apparentTemp:"Feels-like temperature",bodyPerception:"Perceived temperature",maxUv:"Maximum UV",
longRange:"LONG RANGE",monthlyTitle:"16-day forecast",monthlyDescription:"Detailed daily forecast for the next 16 days.",monthlyDisclaimer:"Open-Meteo provides daily forecast data for up to 16 days. Every date shown here is based on forecast data from the API.",temperatureTrend:"TEMPERATURE TREND",monthTemperature:"Temperature trend",
weatherMap:"Weather map",mapDescription:"Interactive map centered on the selected city.",mapNote:"OpenStreetMap DE base map without a user API key. Internet access is required.",
airTitle:"Air quality",airDescription:"Air pollution indicators for the selected city.",citiesTitle:"Saved cities",citiesDescription:"Save places and compare their weather.",savedCities:"Saved",compare:"Compare cities",recentSearches:"Recently viewed",clearHistory:"Clear history",footerLine:"Weather is more than a forecast.",footerDescription:"Weather that helps you feel the rhythm of the city and plan every day.",footerExplore:"Explore",footerTools:"Tools",footerSources:"Data sources",footerForecast:"16-day forecast",footerRadar:"Weather radar",weatherInsightKicker:"WEATHER INSIGHT",
clear:"Clear",mainlyClear:"Mainly clear",partlyCloudy:"Partly cloudy",overcast:"Overcast",fog:"Fog",drizzle:"Drizzle",rain:"Rain",snow:"Snow",showers:"Showers",thunder:"Thunderstorm",unknown:"Variable clouds",
uvLow:"Low",uvModerate:"Moderate",uvHigh:"High",uvVeryHigh:"Very high",uvExtreme:"Extreme",comfortable:"Comfortable",moderateComfort:"Moderate",uncomfortable:"Uncomfortable",wearWarm:"Wear a warm jacket and closed shoes.",wearLight:"Light clothing should work. Remember water.",wearLayer:"Dress in layers — conditions may change.",wearRain:"Take an umbrella or waterproof jacket.",wearWind:"Bring a windbreaker: it is breezy outside.",
goodAir:"Good",moderateAir:"Moderate",sensitiveAir:"Unhealthy for sensitive groups",badAir:"Unhealthy",veryBadAir:"Very unhealthy",hazardAir:"Hazardous",
noResults:"City not found",searchError:"City search failed",weatherError:"Could not load weather data.",locationDenied:"Could not detect your location",citySaved:"City added to favorites",cityRemoved:"City removed from favorites",historyEmpty:"No recent searches yet",favoritesEmpty:"No saved cities yet",compareHint:"Save at least two cities to compare them.",historyCleared:"History cleared",loading:"Loading data…",today:"Today",now:"Now",longRangeLabel:"Climate outlook",notForecast:"Not a forecast",day:"d",hour:"h",updated:"Updated",dayWord:"day",nightWord:"night",airUnavailable:"Air quality data is temporarily unavailable."
}};
const t=k=>words[state.lang][k]||k;
const temp=v=>`${Math.round(state.unit==="fahrenheit"?v*9/5+32:v)}°`;
const dateFmt=(s,opt={})=>new Intl.DateTimeFormat(state.lang==="ru"?"ru-RU":"en-US",opt).format(new Date(s));
const round=v=>Math.round(v);
const safe=(v,d="—")=>v===null||v===undefined?d:v;
function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600);}
function desc(code){const m={0:"clear",1:"mainlyClear",2:"partlyCloudy",3:"overcast",45:"fog",48:"fog",51:"drizzle",53:"drizzle",55:"drizzle",56:"drizzle",57:"drizzle",61:"rain",63:"rain",65:"rain",66:"rain",67:"rain",71:"snow",73:"snow",75:"snow",77:"snow",80:"showers",81:"showers",82:"showers",85:"snow",86:"snow",95:"thunder",96:"thunder",99:"thunder"};return t(m[code]||"unknown");}
function icon(code,day=1){if(code===0)return day?"☀️":"🌙";if([1,2].includes(code))return day?"🌤️":"☁️";if(code===3)return"☁️";if([45,48].includes(code))return"🌫️";if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code))return"🌧️";if([71,73,75,77,85,86].includes(code))return"❄️";if(code>=95)return"⛈️";return"🌤️";}
function uvText(v){if(v<3)return t("uvLow");if(v<6)return t("uvModerate");if(v<8)return t("uvHigh");if(v<11)return t("uvVeryHigh");return t("uvExtreme");}
function windDir(deg){const dirs=state.lang==="ru"?["С","СВ","В","ЮВ","Ю","ЮЗ","З","СЗ"]:["N","NE","E","SE","S","SW","W","NW"];return dirs[Math.round(deg/45)%8];}
function cityDisplay(city=state.city){return state.lang==="ru"?(city.nameRu||city.name):(city.nameEn||city.name);}
function countryDisplay(city=state.city){return state.lang==="ru"?(city.countryRu||city.country):(city.countryEn||city.country);}
async function cityPhoto(city=state.city,code=0){
  const request=++state.photoRequest,box=$("#panoramaImage"),credit=$("#photoCredit");
  const cityName=city.nameEn||city.name||"city",country=city.countryEn||city.country||"";
  const query=[cityName,country,"city panorama skyline"].filter(Boolean).join(" ");
  const lock=[cityName,country].join("-").toLowerCase().replace(/[^a-z0-9]+/g,"-").split("").reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
  const fallback=`https://loremflickr.com/1920/1000/${encodeURIComponent(cityName)},city?lock=${lock}`;
  box.classList.add("is-loading");
  try{
    const search=new URLSearchParams({action:"query",list:"search",srsearch:`${query} filetype:bitmap`,srnamespace:"6",srlimit:"18",format:"json",origin:"*"});
    const sr=await fetch(`https://commons.wikimedia.org/w/api.php?${search}`);
    if(!sr.ok)throw Error("Commons search unavailable");
    const sj=await sr.json(),hits=sj.query?.search||[];
    const ids=hits.map(x=>x.pageid).filter(Boolean).slice(0,12);
    if(!ids.length)throw Error("No city photos found");
    const details=new URLSearchParams({action:"query",pageids:ids.join("|"),prop:"imageinfo",iiprop:"url|extmetadata",iiurlwidth:"2000",iiextmetadatafilter:"LicenseShortName|Artist",format:"json",origin:"*"});
    const ir=await fetch(`https://commons.wikimedia.org/w/api.php?${details}`);
    if(!ir.ok)throw Error("Commons image details unavailable");
    const ij=await ir.json();
    const candidates=Object.values(ij.query?.pages||{}).map(x=>({title:x.title,info:x.imageinfo?.[0]})).filter(x=>x.info?.thumburl && /\.(jpe?g|png|webp)$/i.test(x.info.thumburl));
    const pick=candidates.find(x=>/skyline|panorama|cityscape|city.?view|aerial|landscape/i.test(x.title))||candidates[0];
    if(request!==state.photoRequest)return;
    if(!pick)throw Error("No usable city image");
    const info=pick.info;
    await new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=info.thumburl;});
    if(request!==state.photoRequest)return;
    box.style.backgroundImage=`url("${info.thumburl}")`;
    const artist=(info.extmetadata?.Artist?.value||"Wikimedia Commons").replace(/<[^>]*>/g,"").slice(0,90);
    const license=info.extmetadata?.LicenseShortName?.value||"Commons";
    credit.innerHTML=`<a href="${info.descriptionurl}" target="_blank" rel="noopener noreferrer">${artist} · ${license}</a>`;
  }catch(error){
    if(request!==state.photoRequest)return;
    box.style.backgroundImage=`url("${fallback}")`;
    credit.textContent=state.lang==="ru"?"Фото города":"City photo";
    console.warn("AERIQ city panorama:",error);
  }
  const hour=new Date().getHours(),night=hour<6||hour>=19;
  box.style.filter=night?"brightness(.58) saturate(1.12)":"brightness(.78) saturate(1.12)";
  box.classList.remove("is-loading");
}

async function loadWeather(){
  try{
    const p=new URLSearchParams({latitude:state.city.latitude,longitude:state.city.longitude,timezone:"auto",forecast_days:"16",wind_speed_unit:"kmh",
      current:"temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,uv_index",
      hourly:"temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,uv_index,dew_point_2m,visibility,wind_speed_10m,pressure_msl,apparent_temperature,cloud_cover",
      daily:"weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,daylight_duration"});
    const r=await fetch(`${API}?${p}`);if(!r.ok)throw Error(r.status);state.weather=await r.json();
    renderWeather();addHistory(state.city);loadAir();renderCities();loadMap();renderWeatherInsight();
  }catch(e){console.error(e);toast(t("weatherError"));}
}
function renderWeather(){
  const w=state.weather,c=w.current,h=w.hourly,d=w.daily,di=Math.max(0,d.time.indexOf(c.time.slice(0,10))),hi=Math.max(0,h.time.findIndex(x=>x>=c.time));
  $("#cityName").textContent=cityDisplay();$("#cityMeta").textContent=`${countryDisplay()} · ${dateFmt(c.time,{hour:"2-digit",minute:"2-digit",timeZone:w.timezone})}`;
  $("#cityLocalTime").textContent=dateFmt(c.time,{weekday:"long",day:"numeric",month:"long",hour:"2-digit",minute:"2-digit",timeZone:w.timezone});
  $("#temperature").textContent=Math.round(state.unit==="fahrenheit"?c.temperature_2m*9/5+32:c.temperature_2m);$("#degreeUnit").textContent=state.unit==="celsius"?"°C":"°F";
  $("#condition").textContent=desc(c.weather_code);$("#feelsLike").textContent=temp(c.apparent_temperature);
  $("#todayHigh").textContent=temp(d.temperature_2m_max[di]);$("#todayLow").textContent=temp(d.temperature_2m_min[di]);
  $("#humidity").textContent=`${c.relative_humidity_2m}%`;$("#wind").textContent=`${round(c.wind_speed_10m)} km/h`;$("#windDirection").textContent=windDir(c.wind_direction_10m);
  $("#pressure").textContent=`${round(c.pressure_msl)} hPa`;$("#visibility").textContent=`${round((h.visibility[hi]||10000)/1000)} km`;
  $("#uv").textContent=(c.uv_index??0).toFixed(1);$("#uvLabel").textContent=uvText(c.uv_index??0);$("#dewPoint").textContent=temp(h.dew_point_2m[hi]);
  $("#sunrise").textContent=d.sunrise[di].slice(11,16);$("#sunset").textContent=d.sunset[di].slice(11,16);
  const seconds=d.daylight_duration[di]||0,hrs=Math.floor(seconds/3600),mins=Math.round(seconds%3600/60);
  $("#dayLength").textContent=`${hrs}h ${mins}m`;$("#goldenHour").textContent=`${d.sunrise[di].slice(11,16)} – ${addMinutes(d.sunset[di],-35)}`;
  const current=new Date(c.time),sunrise=new Date(d.sunrise[di]),sunset=new Date(d.sunset[di]),progress=Math.max(0,Math.min(1,(current-sunrise)/(sunset-sunrise)));
  $("#sunPosition").style.left=`${progress*100}%`;
  $("#precipitation").textContent=`${d.precipitation_sum[di]} mm`;$("#cloudCover").textContent=`${c.cloud_cover}%`;
  $("#apparentTemp").textContent=temp(c.apparent_temperature);$("#uvMax").textContent=(d.uv_index_max[di]??0).toFixed(1);$("#uvMaxLabel").textContent=uvText(d.uv_index_max[di]??0);
  const code=c.weather_code;$("#panoramaCard").dataset.weather=code>=95?"storm":[51,53,55,61,63,65,80,81,82].includes(code)?"rain":code===0?"clear":"cloudy";
  $("#panoramaCard").dataset.time=c.is_day?"day":"night";cityPhoto(state.city,code);
  $("#updatedAt").textContent=`${t("updated")} ${new Date().toLocaleTimeString(state.lang==="ru"?"ru-RU":"en-US",{hour:"2-digit",minute:"2-digit"})}`;
  $("#favoriteButton").classList.toggle("saved",isFavorite(state.city));$("#favoriteButton").innerHTML=`${isFavorite(state.city)?"★":"☆"} <span>${t("saveCity")}</span>`;
  renderHourly(hi);renderWeek();renderMonth();renderComfort(c,d,di);renderHourChart(hi);renderMonthChart();
}
function addMinutes(iso,n){const d=new Date(iso);d.setMinutes(d.getMinutes()+n);return d.toLocaleTimeString(state.lang==="ru"?"ru-RU":"en-US",{hour:"2-digit",minute:"2-digit"});}
function renderHourly(start){
  const h=state.weather.hourly,box=$("#hourlyList");box.innerHTML="";
  for(let i=start;i<Math.min(start+24,h.time.length);i++){
    const item=document.createElement("article");item.className="hour-item";
    const time=i===start?t("now"):h.time[i].slice(11,16);
    let val=state.unit==="fahrenheit"?h.temperature_2m[i]*9/5+32:h.temperature_2m[i],extra="";
    const mode=state.hourMode;
    if(mode==="precipitation")val=h.precipitation_probability[i],extra="%";
    if(mode==="wind")val=h.wind_speed_10m[i],extra=" km/h";
    if(mode==="humidity")val=h.relative_humidity_2m[i],extra="%";
    if(mode==="cloud")val=h.cloud_cover[i],extra="%";
    if(mode==="pressure")val=h.pressure_msl[i],extra=" hPa";
    if(mode==="uv")val=h.uv_index[i],extra=" UV";
    if(mode==="visibility")val=(h.visibility[i]||0)/1000,extra=" km";
    if(mode==="feels")val=state.unit==="fahrenheit"?h.apparent_temperature[i]*9/5+32:h.apparent_temperature[i],extra="°";
    const display=mode==="overview"?temp(h.temperature_2m[i]):`${Math.round(val*10)/10}${extra}`;
    item.innerHTML=`<div class="hour-time">${time}</div><div class="hour-icon">${icon(h.weather_code[i])}</div><div class="hour-value">${display}</div><div class="hour-extra">${mode==="overview"?`${h.precipitation_probability[i]??0}% ${state.lang==="ru"?"осадки":"rain"}`:desc(h.weather_code[i])}</div>`;
    box.append(item);
  }
}
function renderWeek(){
  const d=state.weather.daily,box=$("#weekList");box.innerHTML="";
  for(let i=0;i<7;i++){
    const day=i===0?t("today"):dateFmt(`${d.time[i]}T12:00:00`,{weekday:"short"});
    const el=document.createElement("div");el.className="day-item";
    el.innerHTML=`<div class="day-name">${day}</div><div class="day-date">${dateFmt(`${d.time[i]}T12:00:00`,{day:"2-digit",month:"2-digit"})}</div><div class="day-icon">${icon(d.weather_code[i])}</div><div class="day-high">${temp(d.temperature_2m_max[i])}</div><div class="day-low">${temp(d.temperature_2m_min[i])}</div><div class="day-rain">💧 ${d.precipitation_probability_max[i]??0}%</div>`;
    box.append(el);
  }
}
function renderComfort(c,d,i){
  const tempC=c.apparent_temperature,wind=c.wind_speed_10m,precip=c.precipitation||0;
  let score=100-Math.abs(21-tempC)*2.2-Math.max(0,wind-15)*1.1-(precip>0?12:0)-Math.max(0,c.relative_humidity_2m-75)*.25;
  score=Math.max(8,Math.min(98,Math.round(score)));
  $("#comfortScore").textContent=score;$("#comfortLabel").textContent=score>75?t("comfortable"):score>48?t("moderateComfort"):t("uncomfortable");
  $("#comfortText").textContent=score>75?(state.lang==="ru"?"Условия подходят для прогулок и активности на улице.":"Good conditions for outdoor activities."):score>48?(state.lang==="ru"?"Погода умеренная. Учитывай ветер и температуру.":"Conditions are moderate. Consider wind and temperature."): (state.lang==="ru"?"Погодные условия могут быть некомфортными для долгого пребывания на улице.":"Weather may feel uncomfortable for extended outdoor time.");
  let tip=tempC<8?t("wearWarm"):precip>0?t("wearRain"):wind>25?t("wearWind"):tempC>24?t("wearLight"):t("wearLayer");$("#clothingTip").textContent=tip;
}
function renderHourChart(start){
  if(!window.Chart)return;const h=state.weather.hourly,ctx=$("#hourChart");
  const labels=h.time.slice(start,start+24).map(s=>s.slice(11,16));
  const values=h.temperature_2m.slice(start,start+24).map(v=>state.unit==="fahrenheit"?v*9/5+32:v);
  if(state.hourChart)state.hourChart.destroy();
  state.hourChart=new Chart(ctx,{type:"line",data:{labels,datasets:[{data:values,borderColor:"#ff5484",backgroundColor:"rgba(255,56,107,.12)",fill:true,tension:.4,pointRadius:0,pointHitRadius:8,borderWidth:2}]},options:chartOptions()});
}
function renderMonth(){
  const d=state.weather.daily,box=$("#monthGrid");box.innerHTML="";
  d.time.forEach((date,i)=>{
    const el=document.createElement("div");el.className="month-day";
    el.innerHTML=`<div class="month-date">${dateFmt(`${date}T12:00:00`,{weekday:"short",day:"numeric",month:"short"})}</div><div class="month-icon">${icon(d.weather_code[i])}</div><strong>${temp(d.temperature_2m_max[i])} / ${temp(d.temperature_2m_min[i])}</strong><small>${d.precipitation_probability_max[i]??0}% ${state.lang==="ru"?"осадки":"rain"}</small>`;
    box.append(el);
  });
}
function renderWeatherInsight(){
  if(!state.weather)return;
  const h=state.weather.hourly,now=Math.max(0,h.time.findIndex(x=>x>=state.weather.current.time)),end=Math.min(now+6,h.time.length);
  const rain=Math.max(0,...h.precipitation_probability.slice(now,end)),uv=Math.max(0,...h.uv_index.slice(now,end));
  const title=$("#alertTitle"),body=$("#alertText"),tag=$("#alertTag");if(!title||!body)return;
  if(rain>=60){title.textContent=state.lang==="ru"?"Возможны осадки":"Rain may be approaching";body.textContent=state.lang==="ru"?`Вероятность осадков в ближайшие 6 часов достигает ${rain}%. Возьми зонт перед выходом.`:`Precipitation probability reaches ${rain}% in the next 6 hours. Consider taking an umbrella.`;tag.textContent=state.lang==="ru"?"ОСАДКИ":"RAIN";}
  else if(uv>=6){title.textContent=state.lang==="ru"?"Повышенный ультрафиолет":"Elevated UV exposure";body.textContent=state.lang==="ru"?`УФ-индекс может достигать ${uv.toFixed(1)} в ближайшие часы. Используй защиту от солнца.`:`UV index may reach ${uv.toFixed(1)} in the coming hours. Consider sun protection.`;tag.textContent="UV";}
  else{title.textContent=state.lang==="ru"?"Подходящее время для планов":"A good window for your plans";body.textContent=state.lang==="ru"?"В ближайшие часы не ожидается выраженных погодных рисков. Проверь почасовой прогноз перед выходом.":"No major weather risks are indicated in the coming hours. Check the hourly forecast before heading out.";tag.textContent="LIVE";}
}

function chartOptions(){return{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:"#211c2b",titleColor:"#fff",bodyColor:"#ddd"}},scales:{x:{grid:{color:"rgba(255,255,255,.04)"},ticks:{color:"#918a9e",maxTicksLimit:8,font:{size:9}}},y:{grid:{color:"rgba(255,255,255,.05)"},ticks:{color:"#918a9e",font:{size:9}}}}};}
function renderMonthChart(){
  if(!window.Chart)return;const d=state.weather.daily,ctx=$("#monthChart");
  const labels=d.time.map(s=>dateFmt(`${s}T12:00:00`,{day:"numeric",month:"short"}));
  const vals=d.temperature_2m_max.map(v=>state.unit==="fahrenheit"?v*9/5+32:v);
  if(state.monthChart)state.monthChart.destroy();
  state.monthChart=new Chart(ctx,{type:"line",data:{labels,datasets:[{data:vals,borderColor:"#a65aff",backgroundColor:"rgba(255,56,107,.1)",fill:true,tension:.35,pointRadius:2}]},options:chartOptions()});
}
async function geocode(q){
  const p=new URLSearchParams({name:q,count:8,language:state.lang,format:"json"});
  const r=await fetch(`${GEO}?${p}`);if(!r.ok)throw Error();const j=await r.json();return j.results||[];
}
function mapCity(c){return{name:c.name,nameRu:null,nameEn:null,country:c.country,countryRu:null,countryEn:null,latitude:c.latitude,longitude:c.longitude,timezone:c.timezone};}
async function localizeCity(c){
  if(c.nameRu&&c.nameEn&&c.countryRu&&c.countryEn)return c;
  const query=c.nameEn||c.nameRu||c.name;
  try{
    const [ru,en]=await Promise.all(["ru","en"].map(async language=>{
      const p=new URLSearchParams({name:query,count:10,language,format:"json"});
      const r=await fetch(`${GEO}?${p}`);if(!r.ok)return null;const j=await r.json();
      return (j.results||[]).sort((a,b)=>Math.hypot(a.latitude-c.latitude,a.longitude-c.longitude)-Math.hypot(b.latitude-c.latitude,b.longitude-c.longitude))[0]||null;
    }));
    c.nameRu=ru?.name||c.nameRu||c.name;c.nameEn=en?.name||c.nameEn||c.name;
    c.countryRu=ru?.country||c.countryRu||c.country;c.countryEn=en?.country||c.countryEn||c.country;
  }catch{}
  return c;
}
async function setCity(c){state.city=await localizeCity(c);$("#searchResults").classList.remove("show");$("#citySearch").value="";loadWeather();window.scrollTo({top:0,behavior:"smooth"});}
let searchTimer;
$("#citySearch").addEventListener("input",()=>{clearTimeout(searchTimer);const q=$("#citySearch").value.trim();if(q.length<2){$("#searchResults").classList.remove("show");return;}searchTimer=setTimeout(async()=>{try{const results=await geocode(q);const box=$("#searchResults");box.innerHTML="";if(!results.length){box.innerHTML=`<div class="search-result">${t("noResults")}</div>`;}results.forEach(r=>{const el=document.createElement("div");el.className="search-result";el.textContent=[r.name,r.admin1,r.country].filter(Boolean).join(", ");el.onclick=()=>setCity(mapCity(r));box.append(el);});box.classList.add("show");}catch{toast(t("searchError"));}},280);});
$("#searchForm").addEventListener("submit",async e=>{e.preventDefault();const q=$("#citySearch").value.trim();if(!q)return;try{const results=await geocode(q);if(results[0])setCity(mapCity(results[0]));else toast(t("noResults"));}catch{toast(t("searchError"));}});
document.addEventListener("click",e=>{if(!e.target.closest(".search-box"))$("#searchResults").classList.remove("show");});
$("#locationButton").onclick=()=>{if(!navigator.geolocation){toast(t("locationDenied"));return;}navigator.geolocation.getCurrentPosition(async p=>{const coords=p.coords;let name=state.lang==="ru"?"Моё местоположение":"My location";try{const r=await fetch(`${GEO}?latitude=${coords.latitude}&longitude=${coords.longitude}&count=1&language=${state.lang}`);const j=await r.json();if(j.results?.[0]){const c=mapCity(j.results[0]);c.latitude=coords.latitude;c.longitude=coords.longitude;setCity(c);return;}}catch{}setCity({name,nameEn:name,country:"",countryEn:"",latitude:coords.latitude,longitude:coords.longitude,timezone:"auto"});},()=>toast(t("locationDenied")),{timeout:10000});};
$("#unitButton").onclick=()=>{state.unit=state.unit==="celsius"?"fahrenheit":"celsius";$("#unitButton").textContent=state.unit==="celsius"?"°C":"°F";if(state.weather)renderWeather();};
document.querySelectorAll(".lang").forEach(b=>b.onclick=()=>{state.lang=b.dataset.lang;document.documentElement.lang=state.lang;document.querySelectorAll(".lang").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll("[data-i18n]").forEach(el=>el.innerHTML=t(el.dataset.i18n));$("#citySearch").placeholder=state.lang==="ru"?"Найти город...":"Search city...";if(state.weather){renderWeather();renderCities();loadAir();renderWeatherInsight();}});
document.querySelectorAll("[data-hour-mode]").forEach(b=>b.onclick=()=>{state.hourMode=b.dataset.hourMode;document.querySelectorAll("[data-hour-mode]").forEach(x=>x.classList.toggle("active",x===b));renderHourly(Math.max(0,state.weather.hourly.time.findIndex(x=>x>=state.weather.current.time)));});
document.querySelectorAll("[data-hour-view]").forEach(b=>b.onclick=()=>{state.hourView=b.dataset.hourView;document.querySelectorAll("[data-hour-view]").forEach(x=>x.classList.toggle("active",x===b));$("#hourlyList").classList.toggle("hidden",state.hourView==="chart");$("#hourChartWrap").classList.toggle("hidden",state.hourView!=="chart");if(state.hourView==="chart")renderHourChart(Math.max(0,state.weather.hourly.time.findIndex(x=>x>=state.weather.current.time)));});
$("#favoriteButton").onclick=()=>{const id=cityId(state.city);if(isFavorite(state.city)){state.favorites=state.favorites.filter(c=>cityId(c)!==id);toast(t("cityRemoved"));}else{state.favorites.unshift({...state.city});state.favorites=state.favorites.slice(0,12);toast(t("citySaved"));}localStorage.setItem("aeriq-favorites",JSON.stringify(state.favorites));renderCities();$("#favoriteButton").classList.toggle("saved",isFavorite(state.city));$("#favoriteButton").innerHTML=`${isFavorite(state.city)?"★":"☆"} <span>${t("saveCity")}</span>`;};
function cityId(c){return`${c.latitude.toFixed(2)},${c.longitude.toFixed(2)}`;}
function isFavorite(c){return state.favorites.some(x=>cityId(x)===cityId(c));}
function addHistory(c){const id=cityId(c);state.history=[c,...state.history.filter(x=>cityId(x)!==id)].slice(0,8);localStorage.setItem("aeriq-history",JSON.stringify(state.history));}
function renderCities(){
  const saved=$("#savedCities"),hist=$("#historyList");saved.innerHTML="";hist.innerHTML="";
  if(!state.favorites.length)saved.innerHTML=`<p class="section-description">${t("favoritesEmpty")}</p>`;
  state.favorites.forEach(c=>{const el=document.createElement("button");el.className="saved-city";el.innerHTML=`<b>☆</b><strong>${state.lang==="ru"?c.name:c.nameEn||c.name}</strong><span>${state.lang==="ru"?c.country:c.countryEn||c.country}</span>`;el.onclick=()=>setCity(c);saved.append(el);});
  if(!state.history.length)hist.innerHTML=`<p class="section-description">${t("historyEmpty")}</p>`;
  state.history.forEach(c=>{const el=document.createElement("button");el.className="history-chip";el.textContent=state.lang==="ru"?c.name:c.nameEn||c.name;el.onclick=()=>setCity(c);hist.append(el);});
}
$("#clearHistory").onclick=()=>{state.history=[];localStorage.removeItem("aeriq-history");renderCities();toast(t("historyCleared"));};
$("#compareButton").onclick=()=>{const box=$("#compareResult");box.innerHTML="";if(state.favorites.length<2){toast(t("compareHint"));return;}state.favorites.slice(0,3).forEach(async c=>{try{const p=new URLSearchParams({latitude:c.latitude,longitude:c.longitude,current:"temperature_2m,weather_code",timezone:"auto"});const r=await fetch(`${API}?${p}`);const j=await r.json();const el=document.createElement("div");el.className="compare-card";el.innerHTML=`<strong>${state.lang==="ru"?c.name:c.nameEn||c.name}</strong><b>${temp(j.current.temperature_2m)}</b><span class="section-description">${desc(j.current.weather_code)}</span>`;box.append(el);}catch{}});};
async function loadAir(){
  try{
    const p=new URLSearchParams({latitude:state.city.latitude,longitude:state.city.longitude,current:"us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone"});
    const r=await fetch(`${AIR}?${p}`);if(!r.ok)throw Error();const j=await r.json();state.air=j;renderAir();
  }catch(e){$("#aqiAdvice").textContent=t("airUnavailable");}
}
function renderAir(){
  const c=state.air.current,aqi=c.us_aqi??0;let label,color;
  if(aqi<=50){label=t("goodAir");color="#59d6a0";}else if(aqi<=100){label=t("moderateAir");color="#f0cb61";}else if(aqi<=150){label=t("sensitiveAir");color="#f59b55";}else if(aqi<=200){label=t("badAir");color="#ed6575";}else if(aqi<=300){label=t("veryBadAir");color="#b56ce2";}else{label=t("hazardAir");color="#a75a82";}
  $("#aqiValue").textContent=Math.round(aqi);$("#aqiStatus").textContent=label;$("#aqiRing").style.setProperty("--aqi-color",color);
  $("#aqiAdvice").textContent=aqi<=50?(state.lang==="ru"?"Воздух чистый. Подходит для активности на улице.":"Air is clean. Outdoor activity is fine."):aqi<=100?(state.lang==="ru"?"При повышенной чувствительности следи за самочувствием.":"Sensitive people should monitor how they feel."): (state.lang==="ru"?"Сократи длительную интенсивную активность на улице.":"Limit prolonged, intense outdoor activity.");
  const items=[["PM2.5",c.pm2_5,"μg/m³"],["PM10",c.pm10,"μg/m³"],["O₃",c.ozone,"μg/m³"],["NO₂",c.nitrogen_dioxide,"μg/m³"],["SO₂",c.sulphur_dioxide,"μg/m³"],["CO",c.carbon_monoxide,"μg/m³"],["EU AQI",c.european_aqi,""]];
  $("#airGrid").innerHTML=items.map(x=>`<div class="air-tile"><small>${x[0]}</small><strong>${x[1]===undefined?"—":round(x[1])} ${x[2]}</strong></div>`).join("");
}
async function loadMap(){
  if(!window.L)return;
  if(!state.map){
    state.map=L.map("weatherMap",{scrollWheelZoom:false,zoomControl:false}).setView([state.city.latitude,state.city.longitude],10);
    L.control.zoom({position:"bottomright"}).addTo(state.map);
    L.tileLayer("https://tile.openstreetmap.de/{z}/{x}/{y}.png",{attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> · Tiles <a href="https://www.openstreetmap.de/">OpenStreetMap DE</a>',maxZoom:18,updateWhenIdle:true,keepBuffer:2}).addTo(state.map);
    state.mapMarker=L.circleMarker([state.city.latitude,state.city.longitude],{radius:8,color:"#ff477e",weight:3,fillColor:"#ff477e",fillOpacity:.9}).addTo(state.map).bindPopup(cityDisplay());
  }else{state.map.setView([state.city.latitude,state.city.longitude],10);state.mapMarker.setLatLng([state.city.latitude,state.city.longitude]).bindPopup(cityDisplay());}
  setTimeout(()=>state.map.invalidateSize(),180);
}
async function toggleRadar(enabled){
  if(!state.map)return;
  if(!enabled){if(state.radarLayer){state.map.removeLayer(state.radarLayer);state.radarLayer=null;}return;}
  try{
    const r=await fetch("https://api.rainviewer.com/public/weather-maps.json");if(!r.ok)throw Error("radar unavailable");
    const data=await r.json(),frame=data.radar?.past?.at(-1);if(!frame)throw Error("no radar frame");
    if(state.radarLayer)state.map.removeLayer(state.radarLayer);
    const url=`${data.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
    state.radarLayer=L.tileLayer(url,{opacity:.68,attribution:'Weather radar © <a href="https://www.rainviewer.com/">RainViewer</a>',maxZoom:7});state.radarLayer.addTo(state.map);
    $("#mapStatus").textContent=state.lang==="ru"?"РАДАР · ПОСЛЕДНИЙ СЛОЙ":"RADAR · LATEST FRAME";
  }catch(e){$("#mapStatus").textContent=state.lang==="ru"?"РАДАР НЕДОСТУПЕН":"RADAR UNAVAILABLE";toast(state.lang==="ru"?"Радар сейчас недоступен для этого региона.":"Radar is currently unavailable for this region.");document.querySelector('[data-map-layer="radar"]')?.classList.remove("active");}
}
document.querySelectorAll("[data-map-layer]").forEach(b=>b.addEventListener("click",()=>{const radar=b.dataset.mapLayer==="radar";document.querySelectorAll("[data-map-layer]").forEach(x=>x.classList.toggle("active",x===b));toggleRadar(radar);}));

document.querySelectorAll(".nav-link").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();document.querySelectorAll(".nav-link").forEach(x=>x.classList.toggle("active",x===a));const target=$(a.getAttribute("href"));if(target)target.scrollIntoView({behavior:"smooth"});$("#sidebar").classList.remove("open");if(a.dataset.section==="map-section")loadMap();}));
$("#mobileMenu").onclick=()=>{const open=$("#sidebar").classList.toggle("open");$("#mobileMenu").setAttribute("aria-expanded",String(open));};
document.addEventListener("click",e=>{if(window.innerWidth<=850&&!e.target.closest("#sidebar")&&!e.target.closest("#mobileMenu"))$("#sidebar").classList.remove("open");});

// Magnetic tilt is pointer-only; touch and reduced-motion users get a static, accessible layout.
if(matchMedia("(hover:hover) and (pointer:fine)").matches&&!matchMedia("(prefers-reduced-motion: reduce)").matches){
  document.querySelectorAll(".magnetic").forEach(card=>{
    card.addEventListener("pointermove",e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.setProperty("--mx",`${x*2.1}deg`);card.style.setProperty("--my",`${-y*2.1}deg`);card.classList.add("is-hovered");});
    card.addEventListener("pointerleave",()=>{card.style.setProperty("--mx","0deg");card.style.setProperty("--my","0deg");card.classList.remove("is-hovered");});
  });
}
window.addEventListener("load",()=>setTimeout(()=>$("#pageLoader").classList.add("hide"),850));
$("#citySearch").placeholder="Найти город...";
renderCities();loadWeather();

// Scroll reveals are intentionally subtle and disabled for reduced-motion users.
if(!matchMedia("(prefers-reduced-motion: reduce)").matches){
  const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-visible");revealObserver.unobserve(entry.target);}}),{threshold:.08});
  document.querySelectorAll(".page-section,.metric-card,.sun-card,.forecast-lower,.details-panel,.weather-alert").forEach(el=>{el.classList.add("reveal");revealObserver.observe(el);});
}
