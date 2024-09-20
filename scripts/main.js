const flightsDiv = document.getElementById('flights');
const filtersCarrier = document.getElementById('filters-carrier');
const filterTrafnsfer = document.getElementById('filter-trafnsfer');
let arrayFlights;
let formatter = new Intl.NumberFormat("ru");
let carriers = new Set;
let transits = new Set;

const optionsWeekday = {
    weekday: 'short'
};

const optionsDay = {
    month: 'short',
    day: 'numeric'
};

const optionsHour = {
    hour: 'numeric',
    minute: 'numeric'
};

fetch('./test/flights.json')
    .then(response => response.json()) 
    .then(data => {
        arrayFlights = data.result.flights;
        createMain(arrayFlights);
    }).then(()=>{
        const transitsArray = Array.from(transits).sort();

        carriers.forEach((element, index)=>{
            const div = document.createElement('div');
            div.innerHTML = `
                <input type="checkbox" name="carrier" id="sort-carrier-${index}"><label for="sort-carrier-${index}"> - ${element}</label>
            `;
            filtersCarrier.appendChild(div);

            div.querySelector('input').addEventListener('change', () => {
                updateFilter(filterState.carriers, element);
            });
        });

        transitsArray.forEach((element, index)=>{
            const div = document.createElement('div');
            div.innerHTML = `
                <input type="checkbox" name="transit" id="sort-transit-${index}"><label for="sort-transit-${index}"> - ${element}</label>
            `;
            filterTrafnsfer.appendChild(div)

            div.querySelector('input').addEventListener('change', () => {
                const x = element.includes('Без пересадок') ? 0 : index + 1;
                updateFilter(filterState.transits, x); 
            });
        });
    })
    .catch(error => console.error('Ошибка:', error));


function createMain(arr){
    flightsDiv.innerHTML = '';
    if(arr.length == 0) {
        const div = document.createElement('div');
        div.innerHTML = "<p>Полетов по заданным параметрам нет.</p>";
        flightsDiv.appendChild(div);
    } else {
        arr.forEach(element => {
            const div = document.createElement('div');
            div.className = 'flight';
            
            const legs = element.flight.legs;
            let segmentHTML = '';
    
            legs.forEach((leg) => {
    
                const departureSegment = leg.segments[0];
                const arrivalSegment = leg.segments[leg.segments.length - 1];
                const departureCity = departureSegment.departureCity ? departureSegment.departureCity.caption +',' : ' ';
                const departureAirport = departureSegment.departureAirport.caption;
                const departureAirportUid = departureSegment.departureAirport.uid;
                const arrivalCity = arrivalSegment.arrivalCity ? arrivalSegment.arrivalCity.caption+',' : ' ';
                const arrivalAirport = arrivalSegment.arrivalAirport.caption;
                const arrivalAirportUid = arrivalSegment.arrivalAirport.uid;
                carriers.add(element.flight.carrier.caption);
                transits.add(leg.segments.length == 1 ? 'Без пересадок' : getDeclension(leg.segments.length-1, ["пересадка", "пересадки", "пересадок"]));
    
                segmentHTML += `
                    <div class="segment">
                        <div class="flight-main">
                            <div class="leg">
                                <span class="departureAirport">${departureCity} ${departureAirport} <span>(${departureAirportUid}) ➜ </span></span>
                                <span class="arrivalAirport">${arrivalCity} ${arrivalAirport} <span>(${arrivalAirportUid})</span></span>
                            </div>
                            <div class="date">
                                <div class="departure">
                                    <span class="date-hour">${new Date(departureSegment.departureDate).toLocaleString("ru" , optionsHour)}</span> <span class="date-day">${new Date(departureSegment.departureDate).toLocaleString("ru", optionsDay)} ${new Date(departureSegment.departureDate).toLocaleString("ru", optionsWeekday)}</span>
                                </div>
                                <div class="time">
                                    ${getTime(Date.parse(arrivalSegment.arrivalDate) - Date.parse(departureSegment.departureDate))}
    
                                </div>
                                <div class="arrival">
                                    <span class="date-day">${new Date(arrivalSegment.arrivalDate).toLocaleString("ru", optionsDay)} ${new Date(arrivalSegment.arrivalDate).toLocaleString("ru", optionsWeekday)}</span> <span class="date-hour">${new Date(arrivalSegment.arrivalDate).toLocaleString("ru" , optionsHour)}</span> 
                                </div>
                            </div>
                            <div class='transfer'> 
                                <div></div>
                                <span>${leg.segments.length == 1 ? 'Без пересадок' : getDeclension(leg.segments.length-1, ["пересадка", "пересадки", "пересадок"])}</span>
                                <div></div>
                            </div>
                            <div class="carrier">
                                Рейс выполняет: ${departureSegment.airline.caption}
                            </div>
                        </div>
                    </div>`;
                });
    
                div.innerHTML = `
                    <div class="header-flight">
                        <div class="logo">
                            <img src="https://content.airhex.com/content/logos/airlines_${element.flight.carrier.airlineCode}_350_100_r.png" alt="">
                        </div>
                        <div class="price">
                            <span>${formatter.format(element.flight.price.passengerPrices[0].total.amount)} ₽</span><br>
                            <span>Стоимость для одного ${element.flight.price.passengerPrices[0].passengerType.caption == 'Взрослый' ? 'взрослого' : 'детского'} пассажира</span>
                        </div>
                    </div>
                    ${segmentHTML}
                    <button>Выбрать</button>
                `;
    
                flightsDiv.appendChild(div);
            }
        );
    }
    
}

const filterState = {
    priceRange: { min: 0, max: Infinity },
    transits: new Set(), 
    carriers: new Set(), 
    sortType: null
};

const minPrice = document.getElementById('min-price');
const maxPrice = document.getElementById('max-price');

function filterFlights(arrayFlights) {
    const filteredByTransitsAndPrice = arrayFlights
        .filter(flight => {
            if (filterState.transits.size > 0) {
                return flight.flight.legs.every(leg => 
                    filterState.transits.has(leg.segments.length - 1)
                );
            }
            return true;
        })
        .filter(flight => {
            const price = flight.flight.price.passengerPrices[0].total.amount;
            return price >= filterState.priceRange.min && price <= filterState.priceRange.max;
        });

    updateCarrierCheckboxes(filteredByTransitsAndPrice);

    const finalFilteredFlights = filteredByTransitsAndPrice.filter(flight => {
        if (filterState.carriers.size > 0) {
            return filterState.carriers.has(flight.flight.carrier.caption);
        }
        return true;
    });

    return finalFilteredFlights;
}

function updateCarrierCheckboxes(filteredFlights) {
    carriers.forEach((carrier, index) => {
        const hasFlights = filteredFlights.some(flight => flight.flight.carrier.caption === carrier);
        const checkbox = document.getElementById(`sort-carrier-${index}`);
        if (checkbox) {
            checkbox.disabled = !hasFlights;
        }
    });
}

function sortFlights(flights) {
    if (filterState.sortType === "priceRise") {
        return flights.sort((a, b) => a.flight.price.passengerPrices[0].total.amount - b.flight.price.passengerPrices[0].total.amount);
    } else if (filterState.sortType === "priceLow") {
        return flights.sort((a, b) => b.flight.price.passengerPrices[0].total.amount - a.flight.price.passengerPrices[0].total.amount);
    } else if (filterState.sortType === "duration") {
        return flights.sort((a, b) => {
            const durationA = a.flight.legs.reduce((sum, leg) => sum + leg.duration, 0);
            const durationB = b.flight.legs.reduce((sum, leg) => sum + leg.duration, 0);
            return durationA - durationB;
        });
    }
    return flights; 
}

function applyFiltersAndSort() {
    let filteredFlights = filterFlights(arrayFlights);
    let sortedFlights = sortFlights(filteredFlights);
    createMain(sortedFlights);
}

function updatePriceRange(min, max) {
    filterState.priceRange.min = min;
    filterState.priceRange.max = max;
    applyFiltersAndSort(); // Обновляем список с учетом новых цен
}

function updateSort(type) {
    filterState.sortType = type;
    applyFiltersAndSort();
}

function updateFilter(filterSet, value) {
    if (filterSet.has(value)) {
        filterSet.delete(value);
    } else {
        filterSet.add(value);
    }
    applyFiltersAndSort();
}

minPrice.addEventListener('input', () => {
    const min = minPrice.value ? parseFloat(minPrice.value) : 0;
    updatePriceRange(min, filterState.priceRange.max);
});

maxPrice.addEventListener('input', () => {
    const max = maxPrice.value ? parseFloat(maxPrice.value) : Infinity;
    updatePriceRange(filterState.priceRange.min, max);
});

function getTime(millisec) {
    var seconds = (millisec / 1000).toFixed(0);
    var minutes = Math.floor(seconds / 60);
    var hours = "";
    if (minutes > 59) {
        hours = Math.floor(minutes / 60);
        minutes = minutes - (hours * 60);
    }

    seconds = Math.floor(seconds % 60);
    seconds = (seconds >= 10) ? seconds : "0" + seconds;
    if (hours != "") {
        return hours + " ч " + minutes + " мин";
    }
    return minutes + "мин";
}

function getDeclension(number, words) {
    const cases = [2, 0, 1, 1, 1, 2];
    
    let wordIndex;

    if (number % 100 > 4 && number % 100 < 20) {
        wordIndex = 2;
    } else {
        const lastDigit = number % 10;
        const casesIndex = Math.min(lastDigit, 5);
        wordIndex = cases[casesIndex];
    }

    const word = words[wordIndex];
    
    return `${number} ${word}`;
}

