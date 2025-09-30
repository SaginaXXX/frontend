const isElectron = window.api !== undefined;

const getAppHeight = () => {
  if (typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)) {
    return `${window.innerHeight}px`;
  }
  return isElectron ? 'calc(100vh - 30px)' : '100vh';
};

export const layoutStyles = {
  appContainer: {
    width: '100vw',
    height: getAppHeight(),
    bg: 'gray.900',
    color: 'white',
    overflow: 'hidden',
    position: 'relative',
  },
  canvas: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  windowsTitleBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '30px',
    backgroundColor: 'gray.800',
    paddingX: '10px',
    css: { '-webkit-app-region': 'drag' },
  },
  macTitleBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '30px',
    backgroundColor: 'gray.800',
    css: {
      '-webkit-app-region': 'drag',
      '-webkit-user-select': 'none',
    },
  },
  titleBarTitle: {
    fontSize: 'sm',
    color: 'whiteAlpha.800',
    textAlign: 'center',
  },
  titleBarButtons: {
    display: 'flex',
    gap: '1',
  },
  titleBarButton: {
    size: 'sm',
    variant: 'ghost',
    color: 'whiteAlpha.800',
    css: { '-webkit-app-region': 'no-drag' },
    _hover: { backgroundColor: 'whiteAlpha.200' },
  },
  closeButton: {
    size: 'sm',
    variant: 'ghost',
    color: 'whiteAlpha.800',
    css: { '-webkit-app-region': 'no-drag' },
    _hover: { backgroundColor: 'red.500' },
  },
} as const;
