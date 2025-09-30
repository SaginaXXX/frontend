/* eslint-disable react/require-default-props */
import {
  Text, Input, NumberInput, createListCollection, HStack, Box, Icon,
} from '@chakra-ui/react';
import {
  FiGlobe,
  FiCamera,
  FiType,
  FiUser,
  FiWifi,
  FiLink,
  FiMousePointer,
  FiZoomIn,
  FiMic,
  FiBarChart2,
  FiVolumeX,
  FiRefreshCw,
  FiClock,
  FiImage,
} from 'react-icons/fi';
import { Field } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from '@/components/ui/select';
import { settingStyles } from './setting-styles';

// Common Props Types
interface SelectFieldProps {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  collection: ReturnType<typeof createListCollection<{ label: string; value: string }>>
  placeholder: string
}

interface NumberFieldProps {
  label: string
  value: number | string
  onChange: (value: string) => void
  min?: number
  max?: number
  step?: number
  allowMouseWheel?: boolean
}

interface SwitchFieldProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

interface InputFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

// Reusable Components
export function SelectField({
  label,
  value,
  onChange,
  collection,
  placeholder,
}: SelectFieldProps): JSX.Element {
  return (
    <Field
      {...settingStyles.general.field}
      label={
        <HStack gap={2}>
          <Box>
            {/* heuristic icon by label */}
            {String(label).includes('言語') && <Icon as={FiGlobe} boxSize={4} color="gray.700" />}
            {String(label).includes('キャラクター') && <Icon as={FiUser} boxSize={4} color="gray.700" />}
          </Box>
          <Text {...settingStyles.general.field.label}>{label}</Text>
        </HStack>
      }
    >
      <SelectRoot
        {...settingStyles.general.select.root}
        collection={collection}
        value={value}
        onValueChange={(e) => onChange(e.value)}
      >
        <SelectTrigger 
          {...settingStyles.general.select.trigger}
          style={{ color: '#2D3748' }}
        >
          <SelectValueText 
            placeholder={placeholder} 
            style={{ color: '#2D3748' }}
          />
        </SelectTrigger>
        <SelectContent>
          {collection.items.map((item) => (
            <SelectItem key={item.value} item={item}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
    </Field>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  allowMouseWheel,
}: NumberFieldProps): JSX.Element {
  return (
    <Field
      {...settingStyles.common.field}
      label={
        <HStack gap={2}>
          <Box>
            {String(label).includes('閾値') && <Icon as={FiBarChart2} boxSize={4} color="gray.700" />}
            {String(label).includes('無音') && <Icon as={FiVolumeX} boxSize={4} color="gray.700" />}
            {String(label).includes('復元') && <Icon as={FiRefreshCw} boxSize={4} color="gray.700" />}
            {String(label).includes('アイドル') && <Icon as={FiClock} boxSize={4} color="gray.700" />}
          </Box>
          <Text {...settingStyles.common.fieldLabel}>{label}</Text>
        </HStack>
      }
    >
      <NumberInput.Root
        {...settingStyles.common.numberInput.root}
        value={value.toString()}
        onValueChange={(details) => onChange(details.value)}
        min={min}
        max={max}
        step={step}
        allowMouseWheel={allowMouseWheel}
      >
        <NumberInput.Input 
          {...settingStyles.common.numberInput.input} 
          style={{ color: '#2D3748' }}
        />
        <NumberInput.Control>
          <NumberInput.IncrementTrigger />
          <NumberInput.DecrementTrigger />
        </NumberInput.Control>
      </NumberInput.Root>
    </Field>
  );
}

export function SwitchField({ label, checked, onChange }: SwitchFieldProps): JSX.Element {
  return (
    <Field
      {...settingStyles.common.field}
      label={
        <HStack gap={2}>
          <Box>
            {String(label).includes('カメラ') && <Icon as={FiCamera} boxSize={4} color="gray.700" />}
            {String(label).includes('字幕') && <Icon as={FiType} boxSize={4} color="gray.700" />}
            {String(label).toLowerCase().includes('マイク') && <Icon as={FiMic} boxSize={4} color="gray.700" />}
            {String(label).includes('ポインター') && <Icon as={FiMousePointer} boxSize={4} color="gray.700" />}
            {String(label).includes('スクロール') && <Icon as={FiZoomIn} boxSize={4} color="gray.700" />}
          </Box>
          <Text {...settingStyles.common.fieldLabel}>{label}</Text>
        </HStack>
      }
    >
      <Switch
        {...settingStyles.common.switch}
        checked={checked}
        onCheckedChange={(details) => onChange(details.checked)}
      />
    </Field>
  );
}

export function InputField({
  label,
  value,
  onChange,
  placeholder,
}: InputFieldProps): JSX.Element {
  return (
    <Field
      {...settingStyles.general.field}
      label={
        <HStack gap={2}>
          <Box>
            {String(label).includes('WebSocket') && <Icon as={FiWifi} boxSize={4} color="gray.700" />}
            {String(label).includes('ベースURL') && <Icon as={FiLink} boxSize={4} color="gray.700" />}
            {String(label).includes('背景') && <Icon as={FiImage} boxSize={4} color="gray.700" />}
          </Box>
          <Text {...settingStyles.general.field.label}>{label}</Text>
        </HStack>
      }
    >
      <Input
        {...settingStyles.general.input}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ color: '#2D3748' }}
      />
    </Field>
  );
}
