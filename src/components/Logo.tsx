import SteamQuestLogoLight from '../assets/icons/steamQuest_light.webp';
import SteamQuestLogoDark from '../assets/icons/steamQuest_dark.webp';
import { LogoTheme } from '../constants/constants';
import { useOrientation } from '../hooks/useOrientation';
import { CustomLogoURL } from '../types/interfaces';
import { getAssetPath } from '../utils/assetPath';

const Logo = ({
  logoThemeLandScape,
  logoThemePortrait,
  customLogoUrl,
}: {
  logoThemeLandScape?: LogoTheme;
  logoThemePortrait?: LogoTheme;
  customLogoUrl?: CustomLogoURL;
}) => {
  const { isPortrait } = useOrientation();
  const logoTheme = isPortrait ? logoThemePortrait : logoThemeLandScape;

  const getLogo = () => {
    if (customLogoUrl && customLogoUrl.dark && customLogoUrl.light) {
      const url = logoTheme === LogoTheme.DARK ? customLogoUrl.dark : customLogoUrl.light;
      return getAssetPath(url);
    }
    return logoTheme === LogoTheme.DARK ? SteamQuestLogoDark : SteamQuestLogoLight;
  };

  return (
    <div className="absolute top-6 sm:top-[15%] left-[9.7%] xl:top-[85px] z-50">
      <img
        src={getLogo()}
        aria-label="Steam Quest - Math That Makes Sense Logo"
        alt="Steam Quest - Math That Makes Sense Logo"
        className="max-h-[10vh] sm:max-h-[7vh] xl:max-h-[10vh]"
      />
    </div>
  );
};

export default Logo;
