declare module "react-native-rich-editor" {
    import * as React from "react";
    import { StyleProp, ViewStyle } from "react-native";

    export interface RichEditorProps {
        ref?: React.Ref<any>;
        style?: StyleProp<ViewStyle>;
        initialContentHTML?: string;
        placeholder?: string;
        editorStyle?: {
            backgroundColor?: string;
            color?: string;
            placeholderColor?: string;
            contentCSSText?: string;
        };
        onChange?: (html: string) => void;
        [key: string]: any;
    }

    export interface RichToolbarProps {
        editor?: React.Ref<any>;
        actions?: string[];
        iconTint?: string;
        selectedIconTint?: string;
        style?: StyleProp<ViewStyle>;
        [key: string]: any;
    }

    export const actions: { [key: string]: string };
    export class RichEditor extends React.Component<RichEditorProps> {
        setContentHTML(html: string): void;
        getContentHtml(): Promise<string>;
        blurContentEditor(): void;
        focusContentEditor(): void;
    }
    export class RichToolbar extends React.Component<RichToolbarProps> { }
}