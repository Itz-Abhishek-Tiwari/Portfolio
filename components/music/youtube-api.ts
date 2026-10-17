// Loads the YouTube IFrame Player API once and shares it between players.
export type Player = {
  destroy: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  loadVideoById: (id: string | { videoId: string; startSeconds?: number; endSeconds?: number }) => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allow: boolean) => void;
  setVolume: (volume: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getVideoData: () => { title?: string; author?: string; video_id?: string };
  getPlayerState: () => number;
  getPlaylist: () => string[] | null;
  getPlaylistIndex: () => number;
};
export type API = { Player: new (target: HTMLElement, options: Record<string, unknown>) => Player };
declare global {
  interface Window {
    YT?: API;
    onYouTubeIframeAPIReady?: () => void;
  }
}
let apiPromise: Promise<API> | undefined;
export function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise)
    apiPromise = new Promise<API>((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        if (window.YT) resolve(window.YT);
      };
      let script = document.querySelector<HTMLScriptElement>(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
      script.addEventListener(
        'error',
        () => {
          apiPromise = undefined;
          reject(Error('YouTube could not load.'));
        },
        { once: true }
      );
    });
  return apiPromise;
}
