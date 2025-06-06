import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAppServices } from './services/AppServices.js';
import "../global.css"

export default function App() {

  const {
    pickImageAsync,
    takePhotoAsync,
    handleTextSearch,
    itemName,
    setItemName,
    selectedImage,
    result,
    isLoading
  } = useAppServices();

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (galleryStatus.status !== 'granted') {
          Alert.alert('Permissão Negada', 'Precisamos de permissão para acessar sua galeria.');
        }
        const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus.status !== 'granted') {
          Alert.alert('Permissão Negada', 'Precisamos de permissão para acessar sua câmera.');
        }
      }
    })();
  }, []);

    return (
      <ScrollView className="flex-1 bg-gradient-to-b from-blue-200 via-white to-green-100" contentContainerStyle={{ flexGrow: 1 }}>

      {/* Header */}
      <View className="flex-row items-center justify-center bg-white/90 shadow-lg rounded-3xl px-6 py-5 m-5 mt-10">
        <Image
        source={require("../assets/icon.png")}
        className="w-12 h-12 mr-4 rounded-2xl border-2 border-blue-300"
        resizeMode="contain"
        />
        <Text className="text-3xl font-extrabold text-blue-700 tracking-tight drop-shadow-lg">
        Lixeira Inteligente
        </Text>
      </View>

      <View className="items-center mb-6 mt-2 px-6">
        <Text className="text-base text-center text-gray-600 max-w-xs">
        Tire uma foto do resíduo ou digite o nome para saber onde descartar:
        </Text>
      </View>

      <View className="my-4 w-full items-center">
        <TouchableOpacity
        className="flex-row items-center justify-center p-4 bg-blue-600 active:bg-blue-700 rounded-xl mb-3 w-11/12 shadow-lg"
        onPress={pickImageAsync}
        >
        <Text className="text-white text-lg font-semibold">📷 Escolher da Galeria</Text>
        </TouchableOpacity>
        <TouchableOpacity
        className="flex-row items-center justify-center p-4 bg-blue-500 active:bg-blue-600 rounded-xl mb-3 w-11/12 shadow-lg"
        onPress={takePhotoAsync}
        >
        <Text className="text-white text-lg font-semibold">📸 Tirar Foto</Text>
        </TouchableOpacity>

        {selectedImage && (
        <View className="my-4 rounded-2xl overflow-hidden border-4 border-blue-200 shadow-xl">
          <Image source={{ uri: selectedImage }} className="w-52 h-52" />
        </View>
        )}

        <View className="flex-row items-center w-11/12 bg-white rounded-xl shadow-md border border-gray-200 px-3 py-2 mb-3">
        <TextInput
          className="flex-1 h-12 text-base px-2 text-gray-800"
          placeholder="Ex: garrafa pet, lata..."
          placeholderTextColor="#94a3b8"
          value={itemName}
          onChangeText={setItemName}
          onSubmitEditing={handleTextSearch}
          returnKeyType="search"
        />
        </View>

        <TouchableOpacity
        className={`flex-row items-center justify-center p-4 rounded-xl w-11/12 shadow-lg ${
          isLoading ? 'bg-green-400' : 'bg-green-600 active:bg-green-700'
        }`}
        onPress={handleTextSearch}
        disabled={isLoading}
        >
        <Text className="text-white text-lg font-semibold">
          {isLoading ? 'Analisando...' : '🔎 Identificar Resíduo'}
        </Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View className="items-center my-6">
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="text-green-700 mt-2 font-medium">Analisando resíduo...</Text>
        </View>
      )}

      {result && (
        <View className="my-7 items-center bg-white/90 rounded-2xl mx-4 p-5 shadow-2xl border border-green-200">
        <Text className="text-lg font-bold mb-2 text-green-700">Resultado:</Text>
        <View className="items-center justify-center w-28 h-28">
          <Text
          style={{
            fontSize: 80,
            textAlign: 'center',
            includeFontPadding: false,
            textAlignVertical: 'center',
          }}
          className="drop-shadow"
          adjustsFontSizeToFit={false}
          numberOfLines={1}
          >
          {result.emoji}
          </Text>
        </View>
        <Text className="text-base text-center my-1 font-semibold text-blue-800">{result.name}</Text>
        {result.instructions
          .replace(/[#*]+/g, '')
          .split(/\n{2,}|\r{2,}|\r\n{2,}/)
          .map((par, idx) => (
          <Text
            key={idx}
            className="text-base text-left my-1 text-gray-700 bg-blue-50/80 rounded-md py-2 px-3 w-full self-center flex-wrap"
          >
            {par.trim().replace(/(dica:|atenção:|importante:)/gi, match => `\u2022 ${match.toUpperCase()}`)}
          </Text>
          ))}
        {result.impact ? (
          <Text className="text-sm text-green-700 font-bold mt-2 text-center">{result.impact}</Text>
        ) : null}
        </View>
      )}
      </ScrollView>
    );
}