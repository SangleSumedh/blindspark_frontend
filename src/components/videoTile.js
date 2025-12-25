export default function VideoTile({ videoRef, muted }) {
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      // Ensure there are no key props here that cause unnecessary unmounting
      className="w-full h-full object-cover bg-black rounded-lg"
    />
  );
}
