import { useNavigate } from 'react-router-dom';
import { useSpaceStore } from '@/store/spaceStore';

/** Switch into a space, then open the space-level record page. */
export function useOpenSpaceRecord() {
  const navigate = useNavigate();
  const switchSpace = useSpaceStore((state) => state.switchSpace);

  return async (spaceId: string, path: string) => {
    await switchSpace(spaceId);
    navigate(path);
  };
}
