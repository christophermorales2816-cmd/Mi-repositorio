export type ProvinceId = 
| "san-jose"
| "alajuela"
| "heredia"
| "cartago"
| "guanacaste"
| "puntarenas"
| "limon";

export interface Province {
    readonly id: ProvinceId;
    readonly name: string;
    readonly lat: number;
    readonly lon: number;
}

export interface WeatherData {
    readonly temperature: number;
    readonly feelsLike: number;
    readonly humidity: number;
    readonly condition: string;
    readonly icon: string;
    readonly fetchedAt: number;
}

export interface DailyCache {
    readonly date: string;
    readonly data: WeatherData;
}

export interface OpenMeteoResponse {
    hourly: {
        time: string[];
        temperature_2m: number[];
        relativehumidity_2m: number[];
        weathercode: number[];
    };
    }

export interface IWeatherService{
    getWeather(province: Province): Promise<WeatherData>;
}

export interface IStorageService {
    get(provinceId: ProvinceId) : Promise<DailyCache | null>;
    set(provinceId: ProvinceId, data: WeatherData): Promise<void>;
    isStale(cache: DailyCache): boolean;
    clearAll(): Promise<void>;
}