import OpenAI from "openai";

const API_KEY = "sk-cff8c7d790f14f13804babdaf1afc523";

const openai = new OpenAI({
  apiKey: API_KEY,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  dangerouslyAllowBrowser: true,
});

export const getAIResponse = async (userPrompt) => {
  try {
    const response = await openai.chat.completions.create({
      model: "qwen-plus",
      messages: [
        {
          role: "system",
          content:
            "You are a friendly and knowledgeable AI pet assistant. Your role is to provide pet owners with clear, logically sound, and scientifically accurate advice focused on their pets’ health, well-being, and daily care routines. When responding, explain your recommendations in a warm, approachable, and easy-to-understand manner. Tailor your advice to the specific type of pet and situation described, covering topics such as nutrition, exercise, grooming, behavior, and preventive health care. Always base your guidance on current veterinary science and best practices to help owners keep their pets happy and healthy.",
        },
        { role: "user", content: userPrompt },
      ],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Aliyun Error:", error);
    return "An error occured! Please contact to the developer! 🐾";
  }
};

export const getNutritionAdvice = async (petData) => {
  const prompt = `My pet is a ${petData.weight}kg, ${petData.age} ${petData.gender || "pet"}. 
  Calculate the ideal daily grams for Protein, Carbs, and Fats. 
  Format your response strictly as a JSON object: {"protein": "54g", "carbs": "32g", "fat": "7g"}`;

  try {
    const response = await openai.chat.completions.create({
      model: "qwen-plus",
      messages: [{ role: "user", content: prompt }],
    });
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Nutrition AI Error:", error);
    return null;
  }
};
