import { useState, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Download, Image as ImageIcon, Sparkles } from "lucide-react";
import html2canvas from "html2canvas";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    role: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    setPhotoFile(file);
    toast.success("Photo selected!");
  };

  const handleGenerateProfile = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!formData.role.trim()) {
      toast.error("Please enter your role");
      return;
    }

    setGenerating(true);
    try {
      let uploadedPhotoUrl = null;
      if (photoFile) {
        setUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append("file", photoFile);

        try {
          const uploadResponse = await axios.post(`${API}/upload`, formDataUpload, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          uploadedPhotoUrl = `${BACKEND_URL}${uploadResponse.data.url}`;
        } catch (error) {
          console.error("Upload error:", error);
          toast.error("Failed to upload photo");
        } finally {
          setUploading(false);
        }
      }

      const profileData = {
        ...formData,
        photo_url: uploadedPhotoUrl,
      };

      const response = await axios.post(`${API}/profiles`, profileData);
      setProfile(response.data);
      toast.success("Profile generated successfully!");
    } catch (error) {
      console.error("Generate error:", error);
      toast.error("Failed to generate profile");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;

    try {
      toast.loading("Preparing animation...");
      
      if (!window.GIF) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js';
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load GIF.js'));
        });
      }
      
      const card = cardRef.current;
      
      toast.dismiss();
      toast.loading("Capturing animated frames...");
      
      const frames = [];
      const totalFrames = 50;
      
      for (let i = 0; i < totalFrames; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const canvas = await html2canvas(card, {
          backgroundColor: '#000000',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
        });
        
        frames.push(canvas);
      }
      
      toast.dismiss();
      toast.loading("Creating animated GIF...");
      
      const gif = new window.GIF({
        workers: 2,
        quality: 10,
        width: frames[0].width,
        height: frames[0].height,
        workerScript: '/gif.worker.js'
      });
      
      frames.forEach(canvas => {
        gif.addFrame(canvas, { delay: 80 });
      });
      
      gif.on('finished', (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `arcians-${profile.encrypted_id}.gif`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.dismiss();
        toast.success("Animated GIF downloaded! 🎉");
      });
      
      gif.on('error', (error) => {
        console.error('GIF error:', error);
        toast.dismiss();
        toast.error("Failed to create GIF");
      });
      
      gif.render();
      
    } catch (error) {
      console.error("Download error:", error);
      toast.dismiss();
      toast.error("Failed to download card");
    }
  };

  const handleReset = () => {
    setFormData({ name: "", bio: "", role: "" });
    setPhotoFile(null);
    setPhotoPreview("");
    setProfile(null);
  };

  return (
    <div className="cyber-bg min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <header className="relative z-10 py-8 px-6 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_member-id-display/artifacts/ukpdflpi_aYqMoBKH_400x400.jpg" 
              alt="Arcians Logo" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', background: 'linear-gradient(90deg, #ff00ff, #ff1493)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ARCIANS PROFILE
              </h1>
              <p className="text-purple-400 text-sm mt-1">Encrypted Identity Generator</p>
            </div>
          </div>
          <Button
            data-testid="view-gallery-btn"
            onClick={() => navigate("/gallery")}
            className="bg-transparent border-2 border-purple-500 text-purple-400 hover:bg-purple-500/10"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            View Gallery
          </Button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ background: 'linear-gradient(90deg, #ff00ff, #ff1493)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Generate Your Profile
              </h2>
              <p className="text-gray-400 text-sm sm:text-base">
                Create an encrypted identity card with Arcians
              </p>
            </div>

            <Card className="bg-gray-900/50 backdrop-blur-md border-2 border-purple-500/30 p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="photo" className="text-purple-400">Profile Photo</Label>
                <div className="flex items-center gap-4">
                  {photoPreview && (
                    <img src={photoPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-purple-500" />
                  )}
                  <label className="cursor-pointer">
                    <input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                      disabled={uploading}
                      data-testid="photo-upload-input"
                    />
                    <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/50 rounded-lg hover:bg-purple-500/20 transition-colors">
                      <Upload className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-400 text-sm">{photoPreview ? "Change Photo" : "Upload Photo"}</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-purple-400">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  className="bg-gray-800/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500"
                  data-testid="name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-purple-400">Role *</Label>
                <Input
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  placeholder="e.g., Elite Member"
                  className="bg-gray-800/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500"
                  data-testid="role-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-purple-400">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="bg-gray-800/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500 resize-none"
                  data-testid="bio-input"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  data-testid="generate-profile-btn"
                  onClick={handleGenerateProfile}
                  disabled={generating || uploading}
                  className="cyber-button flex-1"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {generating ? "Generating..." : uploading ? "Uploading..." : "Generate Profile"}
                </Button>
                {profile && (
                  <Button
                    data-testid="reset-btn"
                    onClick={handleReset}
                    variant="outline"
                    className="bg-transparent border-2 border-gray-500 text-gray-400 hover:bg-gray-500/10"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6 flex flex-col items-center">
            <div className="w-full max-w-[500px]">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-center" style={{ background: 'linear-gradient(90deg, #ff00ff, #ff1493)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Preview
              </h2>
              <p className="text-gray-400 text-sm sm:text-base text-center">
                Your encrypted identity card
              </p>
            </div>

            {profile ? (
              <div className="space-y-6">
                <div className="profile-card-container flex justify-center">
                  <div ref={cardRef} className="profile-card" data-testid="profile-card">
                    <div className="lightning-pattern"></div>
                    
                    {/* Umbrella Rain Effect */}
                    <div className="umbrella-rain">
                      <div className="umbrella">☂️</div>
                      <div className="umbrella">☂️</div>
                      <div className="umbrella">☂️</div>
                      <div className="umbrella">☂️</div>
                      <div className="umbrella">☂️</div>
                      <div className="umbrella">☂️</div>
                      <div className="umbrella">☂️</div>
                      <div className="umbrella">☂️</div>
                    </div>
                    
                    <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
                      {/* Profile Photo */}
                      <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white photo-glow">
                        <img
                          src={
                            photoPreview || 
                            profile.photo_url ||
                            "https://images.unsplash.com/photo-1706606999710-72658165a73d?w=400"
                          }
                          alt={profile.name}
                          className="w-full h-full object-cover"
                          data-testid="profile-photo"
                          crossOrigin="anonymous"
                        />
                      </div>

                      {/* Username */}
                      <div className="bg-black/60 px-6 py-2 rounded-full">
                        <p className="text-white text-xl font-bold" data-testid="profile-name">
                          @{profile.name.toLowerCase().replace(/\s+/g, '')}
                        </p>
                      </div>

                      {/* Status Level */}
                      <div className="text-center space-y-2">
                        <p className="text-pink-400 text-sm font-bold tracking-wider uppercase">
                          STRENGTH LEVEL:
                        </p>
                        <p className="text-white text-3xl font-bold" data-testid="profile-role" style={{ textShadow: '0 0 10px rgba(255, 0, 255, 0.8)' }}>
                          {profile.role}
                        </p>
                        {profile.bio && (
                          <p className="text-pink-300 text-xl font-bold" data-testid="profile-bio">
                            {profile.bio}
                          </p>
                        )}
                      </div>

                      {/* Logo and ID */}
                      <div className="absolute bottom-8 right-8 text-right space-y-2">
                        <img 
                          src="https://customer-assets.emergentagent.com/job_member-id-display/artifacts/ukpdflpi_aYqMoBKH_400x400.jpg" 
                          alt="Arcians" 
                          className="w-16 h-16 ml-auto object-contain"
                        />
                        <p className="text-purple-300 text-xs">The Arcians Identity</p>
                      </div>

                      <div className="absolute bottom-8 left-8">
                        <p className="encrypted-id" data-testid="profile-encrypted-id">
                          #{profile.encrypted_id}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    data-testid="download-card-btn"
                    onClick={handleDownloadCard}
                    className="cyber-button"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Animated GIF
                  </Button>
                </div>
              </div>
            ) : (
              <div className="profile-card-container flex justify-center">
                <div className="profile-card opacity-50">
                  <div className="lightning-pattern"></div>
                  <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
                    <div className="w-40 h-40 rounded-full bg-gray-800 border-4 border-white flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-gray-600" />
                    </div>
                    <div className="bg-black/60 px-6 py-2 rounded-full">
                      <p className="text-gray-600 text-xl font-bold">@username</p>
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-gray-600 text-sm font-bold tracking-wider">STRENGTH LEVEL:</p>
                      <p className="text-gray-700 text-3xl font-bold">UNKNOWN</p>
                    </div>
                    <p className="text-gray-600 text-sm">Generate a profile to preview</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;