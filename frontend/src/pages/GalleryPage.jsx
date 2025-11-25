import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GalleryPage = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await axios.get(`${API}/profiles`);
      setProfiles(response.data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cyber-bg min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 py-8 px-6 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto">
          <Button
            data-testid="back-home-btn"
            onClick={() => navigate("/")}
            className="bg-transparent border-2 border-purple-500 text-purple-400 hover:bg-purple-500/10 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Generator
          </Button>
          <div className="flex items-center gap-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_member-id-display/artifacts/ukpdflpi_aYqMoBKH_400x400.jpg" 
              alt="Arcians Logo" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', background: 'linear-gradient(90deg, #ff00ff, #ff1493)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ARCIANS PROFILE GALLERY
              </h1>
              <p className="text-purple-400 text-sm mt-1">
                All Generated Encrypted Identities
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto" />
              <p className="text-gray-400">Loading profiles...</p>
            </div>
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="bg-gray-900/50 backdrop-blur-md border-2 border-cyan-500/30 p-12 text-center">
              <p className="text-gray-400 text-lg mb-4">No profiles generated yet</p>
              <Button
                data-testid="create-first-profile-btn"
                onClick={() => navigate("/")}
                className="cyber-button"
              >
                Create Your First Profile
              </Button>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="gallery-grid">
            {profiles.map((profile, index) => (
              <div
                key={profile.id}
                className="profile-card-container"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`gallery-card-${index}`}
              >
                <div className="profile-card mx-auto" style={{ width: '320px', padding: '24px' }}>
                  <div className="scan-line"></div>
                  <div className="relative z-10 space-y-4">
                    {/* Profile Photo */}
                    <div className="flex justify-center">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-purple-500 shadow-lg shadow-purple-500/50">
                        <img
                          src={
                            profile.photo_url ||
                            "https://images.unsplash.com/photo-1706606999710-72658165a73d?w=400"
                          }
                          alt={profile.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Profile Info */}
                    <div className="text-center space-y-3">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">
                          {profile.name}
                        </h3>
                        <p className="text-purple-400 text-sm font-medium">
                          {profile.role}
                        </p>
                      </div>

                      {/* Encrypted ID */}
                      <div className="py-2 px-3 bg-black/40 rounded-lg border border-purple-500/30">
                        <p className="text-xs text-gray-400 mb-1">ID</p>
                        <p className="encrypted-id text-sm">
                          #{profile.encrypted_id}
                        </p>
                      </div>

                      {/* Bio */}
                      {profile.bio && (
                        <div className="text-left py-2 px-3 bg-black/20 rounded-lg border border-purple-500/10">
                          <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">
                            {profile.bio}
                          </p>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <span>GENERATED</span>
                        <span className="text-purple-400">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default GalleryPage;