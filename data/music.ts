
export interface Track {
    id: number;
    title: string;
    artist: string;
    url: string;
}

export const MUSIC_LIBRARY: Track[] = [
    {
        id: 1,
        title: 'Upbeat Funk',
        artist: 'GrooveMaster',
        url: 'https://storage.googleapis.com/test-assets-10152024/music/upbeat-funk.mp3'
    },
    {
        id: 2,
        title: 'Chill Lofi',
        artist: 'StudyCat',
        url: 'https://storage.googleapis.com/test-assets-10152024/music/chill-lofi.mp3'
    },
    {
        id: 3,
        title: 'Epic Cinematic',
        artist: 'Orchestra',
        url: 'https://storage.googleapis.com/test-assets-10152024/music/epic-cinematic.mp3'
    },
    {
        id: 4,
        title: 'Acoustic Folk',
        artist: 'Wanderer',
        url: 'https://storage.googleapis.com/test-assets-10152024/music/acoustic-folk.mp3'
    },
    {
        id: 5,
        title: 'Happy Ukulele',
        artist: 'SunnyStrum',
        url: 'https://storage.googleapis.com/test-assets-10152024/music/happy-ukulele.mp3'
    },
    {
        id: 6,
        title: '80s Synthwave',
        artist: 'RetroFuture',
        url: 'https://storage.googleapis.com/test-assets-10152024/music/80s-synthwave.mp3'
    },
    {
        id: 7,
        title: 'Driving Rock',
        artist: 'RoadRage',
        url: 'https://storage.googleapis.com/test-assets-10152024/music/driving-rock.mp3'
    },
    {
        id: 8,
        title: 'Relaxing Piano',
        artist: 'CloudyKeys',
        url: 'https://storage.googleapis.com/test-assets-10152024/music/relaxing-piano.mp3'
    },
    {
        id: 9,
        title: 'Tropical House',
        artist: 'IslandVibes',
        url: 'https://storage.googleapis.com/test-assets-10152024/music/tropical-house.mp3'
    },
    {
        id: 10,
        title: 'Corporate Pop',
        artist: 'BizTrack',
        url: 'https://storage.googleapis.com/test-assets-10152024/music/corporate-pop.mp3'
    }
];
