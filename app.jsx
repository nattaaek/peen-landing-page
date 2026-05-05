// Tweaks panel + main App
// Wires up the tweaks system

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "tagline": "all in one place.",
  "ctaText": "Get the app",
  "primaryTint": "#D55A1F",
  "animationIntensity": 1,
  "useSandstone": true,
  "heroVariant": "rocks"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // apply primary tint live
  React.useEffect(() => {
    PEEN.tint = tweaks.primaryTint;
    document.documentElement.style.setProperty('--peen-orange', tweaks.primaryTint);
    document.documentElement.style.setProperty('--tint', tweaks.primaryTint);
  }, [tweaks.primaryTint]);

  return (
    <>
      <Nav tweaks={tweaks} setTweak={setTweak}/>
      <Hero tweaks={tweaks}/>
      <Marquee/>
      <Hero3DSection tweaks={tweaks}/>
      <Features/>
      <SendTypes/>
      <PhonesGallery/>
      <ForGyms tweaks={tweaks}/>
      <FinalCTA tweaks={tweaks}/>
      <Footer/>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Brand">
          <TweakColor label="Primary tint" value={tweaks.primaryTint} onChange={v => setTweak('primaryTint', v)}/>
          <TweakText label="Tagline" value={tweaks.tagline} onChange={v => setTweak('tagline', v)}/>
          <TweakText label="CTA text" value={tweaks.ctaText} onChange={v => setTweak('ctaText', v)}/>
        </TweakSection>
        <TweakSection title="Motion">
          <TweakSlider label="Animation intensity" value={tweaks.animationIntensity} min={0} max={2} step={0.1} onChange={v => setTweak('animationIntensity', v)}/>
        </TweakSection>
        <TweakSection title="Imagery">
          <TweakToggle label="Use sandstone photo" value={tweaks.useSandstone} onChange={v => setTweak('useSandstone', v)}/>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
