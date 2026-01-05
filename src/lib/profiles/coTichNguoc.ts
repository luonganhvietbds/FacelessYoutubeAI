// Videlix AI - "Cổ Tích Ngược" Profile Data
// Documentary-style story profile with 45-52 scenes × 19 fields

import { FirebaseProfile } from '@/lib/firebase/firestore';

/**
 * Profile for documentary-style storytelling
 * Outputs structured JSON with detailed scene format
 */
export const coTichNguocProfile: Omit<FirebaseProfile, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
    name: {
        en: 'Reversed Fairy Tales',
        vi: 'Cổ Tích Ngược'
    },
    description: {
        en: 'Documentary-style storytelling with deep psychological elements. Generates 45-52 scenes with detailed visual and audio prompts.',
        vi: 'Kể chuyện phong cách tài liệu với yếu tố tâm lý sâu sắc. Tạo 45-52 cảnh với prompt hình ảnh và âm thanh chi tiết.'
    },
    icon: '🎭',
    category: {
        en: 'Documentary',
        vi: 'Tài liệu'
    },
    isActive: true,
    isPremium: true,
    prompts: {
        idea: {
            en: `You are a creative director for documentary-style storytelling videos.
Generate 5 unique video ideas based on the given topic.

Return a JSON array with exactly 5 objects, each containing:
{
    "id": "idea_1", // unique id
    "title": "Video title (compelling, 60 chars max)",
    "hook": "Opening hook that grabs attention (1 sentence)",
    "angle": "Unique perspective or approach",
    "targetAudience": "Who this is for",
    "emotionalCore": "The central emotion this evokes"
}

Topic: {topic}`,
            vi: `Bạn là giám đốc sáng tạo cho video kể chuyện phong cách tài liệu.
Tạo 5 ý tưởng video độc đáo dựa trên chủ đề cho trước.

Trả về mảng JSON với chính xác 5 object, mỗi object chứa:
{
    "id": "idea_1", // id duy nhất
    "title": "Tiêu đề video (hấp dẫn, tối đa 60 ký tự)",
    "hook": "Câu mở đầu thu hút sự chú ý (1 câu)",
    "angle": "Góc nhìn hoặc cách tiếp cận độc đáo",
    "targetAudience": "Đối tượng mục tiêu",
    "emotionalCore": "Cảm xúc trung tâm mà video gợi lên"
}

Chủ đề: {topic}`
        },
        outline: {
            en: `Create a detailed documentary outline with 5 major blocks containing 45-52 scenes total.

Return a JSON object:
{
    "totalScenes": 48,
    "blocks": [
        {
            "blockNumber": 1,
            "blockTitle": "Block title",
            "theme": "Block theme",
            "scenes": [
                {
                    "sceneNumber": 1,
                    "briefDescription": "Brief scene description",
                    "psychologicalObjective": "What psychological effect to achieve",
                    "estimatedDuration": "8s"
                }
            ]
        }
    ]
}

Block structure:
- Block 1: Opening & Context Setup (8-10 scenes)
- Block 2: Rising Tension (10-12 scenes)  
- Block 3: Crisis Point (10-12 scenes)
- Block 4: Transformation (8-10 scenes)
- Block 5: Resolution & Call (8-10 scenes)

Selected Idea: {selectedIdea}`,
            vi: `Tạo dàn ý tài liệu chi tiết với 5 block chính chứa tổng cộng 45-52 cảnh.

Trả về JSON object:
{
    "totalScenes": 48,
    "blocks": [
        {
            "blockNumber": 1,
            "blockTitle": "Tiêu đề block",
            "theme": "Chủ đề block",
            "scenes": [
                {
                    "sceneNumber": 1,
                    "briefDescription": "Mô tả ngắn gọn cảnh",
                    "psychologicalObjective": "Mục tiêu tâm lý cần đạt",
                    "estimatedDuration": "8s"
                }
            ]
        }
    ]
}

Cấu trúc Block:
- Block 1: Mở đầu & Thiết lập bối cảnh (8-10 cảnh)
- Block 2: Căng thẳng dâng cao (10-12 cảnh)
- Block 3: Điểm khủng hoảng (10-12 cảnh)
- Block 4: Chuyển hóa (8-10 cảnh)
- Block 5: Giải quyết & Kêu gọi (8-10 cảnh)

Ý tưởng đã chọn: {selectedIdea}`
        },
        script: {
            en: `Generate complete script with detailed scenes. Each scene MUST have all 19 fields.

Return JSON:
{
    "scenes": [
        {
            "sceneNumber": 1,
            "block": 1,
            "psychologicalObjective": "What psychological effect this scene achieves",
            "narrativeFunction": "Role in the story arc",
            "sceneDescription": "Detailed description of what happens",
            "context": "Environment, setting, atmosphere",
            "subject": "Main subject/character in frame",
            "emotionalState": "Emotional tone/mood",
            "motion": "Movement description (camera or subject)",
            "camera": "Camera angle/movement (e.g., 'slow zoom in', 'tracking shot')",
            "lighting": "Lighting setup and mood",
            "visualSymbolism": "Symbolic visual elements",
            "audioEffect": "Sound effects or atmosphere",
            "voiceOver": "Narration text (20-30 words, emotional, engaging)",
            "feasibilityLevel": "easy|medium|hard",
            "feasibilityNote": "Technical notes for production",
            "suggestion": "Alternative approach if needed",
            "imagePrompt": "Detailed prompt for AI image generation (MidJourney style)",
            "videoPrompt": "Detailed prompt for AI video generation (including motion)"
        }
    ],
    "totalDuration": "6:30",
    "wordCount": 1200
}

Generate all 45-52 scenes based on the outline.
Each voiceOver should be emotionally compelling, 20-30 words.
Each imagePrompt should be detailed, cinematic, MidJourney-ready.

Outline: {outline}`,
            vi: `Tạo kịch bản hoàn chỉnh với các cảnh chi tiết. Mỗi cảnh PHẢI có đủ 19 trường.

Trả về JSON:
{
    "scenes": [
        {
            "sceneNumber": 1,
            "block": 1,
            "psychologicalObjective": "Mục tiêu tâm lý cảnh này đạt được",
            "narrativeFunction": "Vai trò trong cốt truyện",
            "sceneDescription": "Mô tả chi tiết những gì xảy ra",
            "context": "Môi trường, bối cảnh, không khí",
            "subject": "Chủ thể/nhân vật chính trong khung hình",
            "emotionalState": "Tông cảm xúc/tâm trạng",
            "motion": "Mô tả chuyển động (camera hoặc chủ thể)",
            "camera": "Góc/chuyển động camera (vd: 'zoom chậm vào', 'tracking shot')",
            "lighting": "Thiết lập ánh sáng và mood",
            "visualSymbolism": "Các yếu tố biểu tượng hình ảnh",
            "audioEffect": "Hiệu ứng âm thanh hoặc không khí",
            "voiceOver": "Lời thoại (20-30 từ, cảm xúc, lôi cuốn)",
            "feasibilityLevel": "easy|medium|hard",
            "feasibilityNote": "Ghi chú kỹ thuật cho sản xuất",
            "suggestion": "Cách tiếp cận thay thế nếu cần",
            "imagePrompt": "Prompt chi tiết cho AI tạo hình (phong cách MidJourney)",
            "videoPrompt": "Prompt chi tiết cho AI tạo video (bao gồm chuyển động)"
        }
    ],
    "totalDuration": "6:30",
    "wordCount": 1200
}

Tạo tất cả 45-52 cảnh dựa trên dàn ý.
Mỗi voiceOver phải có cảm xúc, 20-30 từ.
Mỗi imagePrompt phải chi tiết, điện ảnh, sẵn sàng cho MidJourney.

Dàn ý: {outline}`
        },
        metadata: {
            en: `Generate video metadata for YouTube optimization.

Return JSON:
{
    "title": ["Title option 1 (max 60 chars)", "Title option 2", "Title option 3"],
    "description": "Compelling description with keywords (500-1000 chars)",
    "tags": ["tag1", "tag2", "tag3", ...15-20 tags],
    "thumbnailPrompt": [
        "Thumbnail prompt option 1 - dramatic, high contrast, emotional",
        "Thumbnail prompt option 2 - different angle or composition"
    ],
    "estimatedDuration": "6:30",
    "category": "Education/Entertainment"
}

Based on script: {script}`,
            vi: `Tạo metadata video cho tối ưu YouTube.

Trả về JSON:
{
    "title": ["Lựa chọn tiêu đề 1 (tối đa 60 ký tự)", "Lựa chọn 2", "Lựa chọn 3"],
    "description": "Mô tả hấp dẫn với từ khóa (500-1000 ký tự)",
    "tags": ["tag1", "tag2", "tag3", ...15-20 tags],
    "thumbnailPrompt": [
        "Prompt thumbnail 1 - kịch tính, tương phản cao, cảm xúc",
        "Prompt thumbnail 2 - góc nhìn hoặc bố cục khác"
    ],
    "estimatedDuration": "6:30",
    "category": "Giáo dục/Giải trí"
}

Dựa trên kịch bản: {script}`
        }
    }
};

/**
 * Sample scene for testing/reference
 */
export const sampleScene = {
    sceneNumber: 1,
    block: 1,
    psychologicalObjective: "Create intrigue and emotional connection",
    narrativeFunction: "Opening hook - establish mood",
    sceneDescription: "A lone figure stands at the edge of a misty forest, looking back at a distant village",
    context: "Dawn, misty forest edge, ethereal atmosphere",
    subject: "Silhouette of a young woman in traditional clothing",
    emotionalState: "Melancholic yet hopeful",
    motion: "Slow reveal from mist, subject slightly sways",
    camera: "Slow push in from wide to medium shot",
    lighting: "Soft golden hour backlight, volumetric fog",
    visualSymbolism: "Threshold between known and unknown worlds",
    audioEffect: "Distant birds, gentle wind, subtle ambient music",
    voiceOver: "Họ nói rằng, có những câu chuyện cổ tích mà người lớn không dám kể cho trẻ con. Đây là một trong số đó.",
    feasibilityLevel: "easy",
    feasibilityNote: "Can use stock footage with AI enhancement",
    suggestion: "Consider adding subtle particle effects",
    imagePrompt: "Silhouette of young Vietnamese woman in áo dài standing at misty forest edge, golden hour backlighting, volumetric fog, cinematic composition, Kodak Portra 400 film grain, 35mm lens, dramatic atmosphere --ar 16:9 --v 6",
    videoPrompt: "Slow cinematic reveal through morning mist, camera gently pushes toward silhouetted figure, volumetric lighting, dreamy atmosphere, 4K, 24fps, smooth motion"
};
