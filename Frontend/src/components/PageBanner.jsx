/**
 * Photo header used at the top of a page — a real photo with a dark gradient
 * scrim so the title/subtitle stay readable over it, instead of a plain
 * text-only heading.
 */
const PageBanner = ({ image, title, children }) => (
  <div className="relative rounded-2xl overflow-hidden mb-6 h-36 sm:h-44">
    <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
    <div className="relative h-full flex flex-col justify-end p-5 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-white m-0">{title}</h1>
      {children && <p className="text-sm text-white/90 mt-1.5 mb-0 max-w-2xl">{children}</p>}
    </div>
  </div>
);

export default PageBanner;
