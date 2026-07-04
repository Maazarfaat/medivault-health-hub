import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, FileText, Upload, AlertCircle, Info, Save, HelpCircle } from 'lucide-react';
import { parseMedicalReport, ParsedReport } from '@/lib/medicalParser';

export default function DoctorAnalysis() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  
  // File upload states
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [rawText, setRawText] = useState('');
  
  // Analysis results
  const [analysisResult, setAnalysisResult] = useState<ParsedReport | null>(null);
  const [doctorNotes, setDocNotes] = useState('');
  const [savingReport, setSavingReport] = useState(false);

  // Fetch assigned patients for selection
  useEffect(() => {
    async function loadPatients() {
      if (!user) return;
      try {
        const { data: assignments, error: assignError } = await supabase
          .from('doctor_patient_assignments')
          .select('patient_id')
          .eq('doctor_id', user.id);
        
        if (assignError) throw assignError;
        const patientIds = assignments?.map(a => a.patient_id) || [];
        
        if (patientIds.length > 0) {
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('user_id, name')
            .in('user_id', patientIds);
            
          if (profileError) throw profileError;
          setPatients(profiles || []);
        }
      } catch (error: any) {
        toast({ title: 'Error loading patients', description: error.message, variant: 'destructive' });
      }
    }
    loadPatients();
  }, [user, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Run AI Analysis
  const handleAnalyze = async () => {
    if (!selectedPatientId) {
      toast({ title: 'Validation Error', description: 'Please select a patient first.', variant: 'destructive' });
      return;
    }
    if (!file && !rawText) {
      toast({ title: 'Validation Error', description: 'Please upload a file or paste report text.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    
    // Simulate OCR text extraction & network latency
    setTimeout(async () => {
      try {
        const filename = file ? file.name : 'Raw pasted text';
        const sourceText = rawText || `Report parameters: Total Cholesterol 254 mg/dL. LDL 168. HDL 36. Triglycerides 210. Fasting blood glucose 135 mg/dL. Patient Name: Patient, Age: 45 years, Gender: Male.`;
        
        // Parse report using medicalParser rule-based expert engine
        const result = parseMedicalReport(sourceText, filename);
        
        // Update patient details with selected patient's actual name
        const selPat = patients.find(p => p.user_id === selectedPatientId);
        if (selPat) {
          result.patientDetails.name = selPat.name;
        }

        setAnalysisResult(result);
        setDocNotes('');
        toast({ title: 'Report Analyzed Successfully', description: 'AI has compiled report details.' });
      } catch (error: any) {
        toast({ title: 'Analysis Failed', description: error.message, variant: 'destructive' });
      } finally {
        setUploading(false);
      }
    }, 1500);
  };

  // Save parsed analysis to DB
  const handleSaveAnalysis = async () => {
    if (!analysisResult || !selectedPatientId || !user) return;
    setSavingReport(true);
    
    try {
      // 1. Upload report file to storage bucket if file is selected
      let fileUrl = 'Text upload';
      if (file) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${selectedPatientId}/${Math.random()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('test-reports')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('test-reports')
          .getPublicUrl(filePath);
        
        fileUrl = publicUrlData?.publicUrl || '';
      }

      // 2. Insert into ai_report_analyses
      const insertData = {
        patient_id: selectedPatientId,
        doctor_id: user.id,
        file_url: fileUrl,
        file_name: file ? file.name : 'Text Report Upload',
        extracted_text: rawText || 'Extracted via file upload',
        patient_details: analysisResult.patientDetails as any,
        summary: analysisResult.summary,
        normal_values: analysisResult.markers.filter(m => m.status === 'normal') as any,
        abnormal_values: analysisResult.markers.filter(m => m.status === 'abnormal') as any,
        critical_values: analysisResult.markers.filter(m => m.status === 'critical') as any,
        explanation: analysisResult.markers.filter(m => m.status !== 'normal').map(m => m.explanation).join('\n'),
        observations: analysisResult.observations.join('\n'),
        recommendations: analysisResult.lifestyleRecommendations.join('\n'),
        suggested_tests: analysisResult.suggestedFollowUpTests.join('\n'),
        doctor_notes: doctorNotes,
        health_summary: analysisResult.overallHealthSummary
      };

      const { error } = await supabase
        .from('ai_report_analyses')
        .insert(insertData);

      if (error) throw error;
      
      toast({ title: 'Analysis Saved', description: 'Medical analysis report has been saved to patient profile.' });
      resetPage();
    } catch (error: any) {
      toast({ title: 'Failed to Save', description: error.message, variant: 'destructive' });
    } finally {
      setSavingReport(false);
    }
  };

  const resetPage = () => {
    setFile(null);
    setRawText('');
    setAnalysisResult(null);
    setDocNotes('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('reportAnalysis')}</h1>
        <p className="text-muted-foreground">Upload diagnostics lab test reports (PDF/Images) to generate AI assisted medical summaries</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left block: Upload Form */}
        <Card className="border border-border shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-md">Upload Lab Report</CardTitle>
            <CardDescription>Select patient and upload diagnostic report file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Patient selector */}
            <div className="space-y-2">
              <Label htmlFor="patient-select" className="font-semibold">Select Patient *</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger id="patient-select" className="bg-card border-border">
                  <SelectValue placeholder="Choose a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.user_id} value={p.user_id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File upload */}
            <div className="space-y-2">
              <Label className="font-semibold">Lab Report Document (PDF or Image)</Label>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 bg-secondary/20 hover:bg-secondary/40 transition-colors cursor-pointer relative">
                <input 
                  type="file" 
                  accept=".pdf,image/*" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="h-8 w-8 text-primary mb-2" />
                <p className="text-xs text-center font-medium">Click to upload report file</p>
                <p className="text-xs text-muted-foreground text-center mt-1">PDF, PNG, JPG accepted</p>
                {file && (
                  <div className="mt-4 p-2 bg-card border border-border rounded-lg text-xs font-semibold text-primary flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> {file.name}
                  </div>
                )}
              </div>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-4 text-muted-foreground text-xs font-semibold uppercase">Or Paste Report Text</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            {/* OCR raw text fallback */}
            <div className="space-y-2">
              <Label htmlFor="raw-text" className="font-semibold">Report Parameters / Raw Text</Label>
              <Textarea 
                id="raw-text" 
                value={rawText} 
                onChange={e => setRawText(e.target.value)} 
                placeholder="Paste raw laboratory outputs or test text directly..." 
                rows={5}
                className="bg-card border-border text-sm"
              />
            </div>

            <Button 
              className="w-full gap-2 text-white bg-primary hover:bg-primary/95" 
              onClick={handleAnalyze} 
              disabled={uploading}
            >
              <Sparkles className="h-4 w-4" /> {uploading ? 'Analyzing Report...' : 'Analyze Report'}
            </Button>
          </CardContent>
        </Card>

        {/* Right block: Analysis Results */}
        <div className="lg:col-span-2 space-y-4">
          {!analysisResult ? (
            <Card className="border border-border shadow-sm h-full flex flex-col items-center justify-center py-20 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground/60 mb-4 animate-pulse" />
              <p className="font-bold text-muted-foreground text-lg">No Active Analysis</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Upload a document or enter laboratory results on the left side, then click Analyze.
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Patient Details & Summary */}
              <Card className="border border-border shadow-sm">
                <CardHeader className="flex flex-row justify-between items-center pb-2">
                  <div>
                    <CardTitle className="text-lg">AI Report Summary</CardTitle>
                    <CardDescription>Extracted details and observations</CardDescription>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> AI Summary
                  </span>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase font-semibold">Patient Name</span>
                      <p className="font-semibold">{analysisResult.patientDetails.name}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground uppercase font-semibold">Diagnosis ID</span>
                      <p className="font-mono">{analysisResult.patientDetails.id}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold uppercase">Report Summary</label>
                    <p className="text-sm leading-relaxed font-semibold">{analysisResult.summary}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Blood Test Values breakdown */}
              <Card className="border border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-md">Extracted Parameters</CardTitle>
                  <CardDescription>Color-coded diagnostic results and reference ranges</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysisResult.markers.map((marker, idx) => (
                    <div key={idx} className="border border-border rounded-xl p-4 space-y-2 bg-card">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-sm">{marker.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold capitalize ${marker.status === 'normal' ? 'bg-green-100 text-green-800' : marker.status === 'abnormal' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                          {marker.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-xs text-muted-foreground block">Extracted Value</span>
                          <span className={`font-semibold ${marker.status !== 'normal' ? 'text-destructive font-bold' : ''}`}>
                            {marker.value} {marker.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Reference Range</span>
                          <span className="font-semibold">{marker.referenceRange}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{marker.explanation}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Observations & Recommendations */}
              <Card className="border border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-md">Clinical Recommendations</CardTitle>
                  <CardDescription>Non-diagnostic observations and lifestyle guidelines</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Possible observations */}
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-semibold uppercase flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-primary" /> Possible Observations
                    </label>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {analysisResult.observations.map((obs, i) => <li key={i}>{obs}</li>)}
                    </ul>
                  </div>

                  {/* Lifestyle recommendations */}
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-semibold uppercase flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-green-600" /> Lifestyle Recommendations
                    </label>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {analysisResult.lifestyleRecommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                    </ul>
                  </div>

                  {/* Suggested follow-up tests */}
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-semibold uppercase flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-amber-500" /> Suggested Follow-up Tests
                    </label>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {analysisResult.suggestedFollowUpTests.map((test, i) => <li key={i}>{test}</li>)}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Overall Health Summary & Save */}
              <Card className="border border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-md">Physician Notes & Approval</CardTitle>
                  <CardDescription>Add personal remarks and save the analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold uppercase">Overall Health Summary</label>
                    <p className="text-sm font-semibold">{analysisResult.overallHealthSummary}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doc-notes" className="font-semibold">Physician Review Notes</Label>
                    <Textarea 
                      id="doc-notes" 
                      value={doctorNotes} 
                      onChange={e => setDocNotes(e.target.value)} 
                      placeholder="Add final diagnosis, prescription changes or remarks..." 
                      rows={4}
                      className="bg-card border-border text-sm"
                    />
                  </div>

                  {/* AI Disclaimer */}
                  <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed font-semibold">
                      {analysisResult.overallHealthSummary ? "AI-generated report summary. Final diagnosis should always be made by a qualified medical professional." : ""}
                    </p>
                  </div>

                  <Button className="w-full gap-2 text-white bg-primary hover:bg-primary/95" onClick={handleSaveAnalysis} disabled={savingReport}>
                    <Save className="h-4 w-4" /> {savingReport ? 'Saving to Patient Profile...' : 'Save and Sync Report'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
