const isElectron = window.api !== undefined;

// 针对树莓派优化的轻量级样式配置
// 移除所有动画、过渡效果和复杂阴影以提高性能
export const settingStyles = {
  settingUI: {
    container: {
      width: '100%',
      height: '100%',
      p: 0,
      gap: 0,
      position: 'relative',
      overflowY: 'auto',
      // 简化滚动条样式，减少GPU负载
      css: {
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          bg: 'gray.200',
        },
        '&::-webkit-scrollbar-thumb': {
          bg: 'gray.400',
        },
      },
    },
    header: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
    },
    title: {
      fontSize: 'lg',
      fontWeight: '600',
      color: 'gray.800',
    },
    tabs: {
      root: {
        width: '100%',
          variant: 'plain' as const,
          colorPalette: 'purple',
      },
      content: {
        p: 4,
        bg: 'white',
      },
      trigger: {
        px: 3,
        py: 2,
        borderRadius: 'md',
        fontSize: 'sm',
        fontWeight: '500',
        color: 'gray.700',
        bg: 'transparent',
        border: 'none',
        // 移除所有过渡动画以优化性能
        _selected: {
          color: 'purple.600',
          bg: 'purple.50',
        },
        _hover: {
          color: 'purple.500',
          bg: 'gray.50',
        },
      },
      list: {
        display: 'flex',
        gap: 1,
        justifyContent: 'flex-start',
        width: '100%',
        borderBottom: '1px solid',
        borderColor: 'gray.200',
        bg: 'gray.50',
        p: 2,
      },
    },
    footer: {
      width: '100%',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 2,
      p: 4,
      borderTop: '1px solid',
      borderColor: 'gray.200',
      bg: 'gray.50',
    },
    drawerContent: {
      bg: 'white',
      maxWidth: '450px',
      height: isElectron ? 'calc(100vh - 30px)' : '100vh',
      // 移除阴影以减少渲染负载
      border: '1px solid',
      borderColor: 'gray.300',
      borderRadius: 'md',
      overflow: 'hidden',
    },
    drawerHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      position: 'relative',
      px: 4,
      py: 3,
      bg: 'white',
      borderBottom: '1px solid',
      borderColor: 'gray.200',
    },
    drawerTitle: {
      color: 'gray.800',
      fontSize: 'lg',
      fontWeight: '600',
    },
    closeButton: {
      position: 'absolute',
      right: 2,
      top: 2,
      color: 'gray.700',
      _hover: { color: 'gray.900' },
    },
  },
  general: {
    container: {
      align: 'stretch',
      gap: 4,
      p: 0,
    },
    field: {
      label: {
        color: 'gray.700',
        fontWeight: '500',
      },
    },
    select: {
      root: {
        colorPalette: 'purple',
        bg: 'white',
      },
      trigger: {
        bg: 'gray.50',
        borderColor: 'gray.300',
        // 简化交互状态，移除复杂动画和阴影
        _focus: {
          borderColor: 'purple.400',
        },
      },
    },
    input: {
      bg: 'gray.50',
      borderColor: 'gray.300',
      color: 'gray.800',
      _placeholder: {
        color: 'gray.500',
      },
      _focus: {
        bg: 'white',
        borderColor: 'purple.400',
        color: 'gray.800',
      },
    },
    buttonGroup: {
      gap: 2,
      width: '100%',
    },
    button: {
      width: '50%',
      variant: 'outline' as const,
      colorPalette: 'purple' as const,
    },
    fieldLabel: {
      fontSize: 'sm',
      color: 'gray.700',
      fontWeight: '500',
    },
  },
  common: {
    field: {
      orientation: 'horizontal' as const,
    },
    fieldLabel: {
      fontSize: 'sm',
      color: 'gray.700',
      fontWeight: '500',
      whiteSpace: 'nowrap' as const,
    },
    switch: {
      size: 'md' as const,
      colorPalette: 'purple' as const,
      variant: 'solid' as const,
    },
    numberInput: {
      root: {
        pattern: '[0-9]*\\.?[0-9]*',
        inputMode: 'decimal' as const,
      },
      input: {
        bg: 'gray.50',
        borderColor: 'gray.300',
        color: 'gray.800',
        _placeholder: {
          color: 'gray.500',
        },
        _focus: {
          bg: 'white',
          borderColor: 'purple.400',
          color: 'gray.800',
        },
      },
    },
    container: {
      gap: 4,
      maxW: 'lg',
      css: { '--field-label-width': '120px' },
    },
    input: {
      bg: 'gray.50',
      borderColor: 'gray.300',
      color: 'gray.800',
      _placeholder: {
        color: 'gray.500',
      },
      _focus: {
        bg: 'white',
        borderColor: 'blue.400',
        color: 'gray.800',
      },
    },
    select: {
      root: {
        colorPalette: 'purple',
        bg: 'white',
      },
      trigger: {
        bg: 'gray.50',
        borderColor: 'gray.300',
        color: 'gray.800',
        _placeholder: {
          color: 'gray.500',
        },
        _focus: {
          borderColor: 'purple.400',
          bg: 'white',
          color: 'gray.800',
        },
      },
    },
  },
  live2d: {
    container: {
      gap: 4,
      maxW: 'lg',
      css: { '--field-label-width': '120px' },
    },
  },
};